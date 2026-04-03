"""
Investigator Agent (connector.py)

Traces connections between key entities from the Historian's research.
Builds the PI board JSON used by the frontend.

Replaces hardcoded KB lookups with live Wikipedia searches +
connection hints from the knowledge base.
"""

import json
import asyncio
import anthropic
from utils import create_with_retry
from core.config import settings
from tools.knowledge_base import (
    deep_wikipedia_retrieval,
    format_deep_context,
    get_connection_hints,
)


INVESTIGATOR_SYSTEM = """You are the Investigator for Severus, a world history learning platform.

You receive research about a historical topic and your job is to map the connections
between the key entities — people, events, institutions, and concepts.

You output TWO things:
1. A written analysis of the most important connections (2-3 paragraphs)
2. A pi_board JSON block containing nodes and edges for the visual board

RULES FOR CONNECTIONS:
- Every connection must be historically documented — not assumed
- Label edges with precise verb phrases: "caused", "financed", "overthrew", "led to",
  "founded", "conquered", "abolished", "triggered", "resisted", "signed"
- Do NOT connect entities just because they existed in the same era or region
- Flag contested connections honestly
- Maximum 12 nodes, 15 edges

NODE TYPES: "person" | "event" | "institution" | "concept"

OUTPUT the pi_board block exactly like this at the end of your response:

```pi_board
{
  "nodes": [
    {"id": "n1", "label": "Label", "type": "person|event|institution|concept", "date": "year or null"}
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "connection verb phrase", "weight": 0.8, "contested": false}
  ]
}
```"""


async def _fetch_wikipedia_context(entities: list[str]) -> str:
    """Kept for backward compat — deep_wikipedia_retrieval is used instead."""
    return ""


def _extract_entities_from_research(researcher_output: str) -> list[str]:
    """
    Pull entity names from the historian's output for Wikipedia lookup.
    Looks for KEY FIGURES section and named entities.
    """
    entities = []
    lines = researcher_output.split("\n")

    in_figures = False
    for line in lines:
        line = line.strip()
        if "KEY FIGURES" in line.upper() or "KEY ENTITIES" in line.upper():
            in_figures = True
            continue
        if in_figures:
            if line.startswith("•") or line.startswith("-"):
                # Extract name before the dash or em-dash
                name_part = line.lstrip("•- ").split("—")[0].split("-")[0].strip()
                if name_part and len(name_part) > 2:
                    entities.append(name_part)
            elif line == "" and entities:
                break  # end of section

    # Also try to extract topic from the first line
    if not entities and lines:
        for line in lines[:3]:
            if "•" in line:
                part = line.split("•")[1].split("—")[0].strip()
                if part:
                    entities.append(part)

    return entities[:6]


async def run_investigator(state: dict) -> dict:
    client = anthropic.Anthropic()
    events = []

    question        = state["question"]
    researcher_out  = state.get("researcher_output", "") or state.get("historian_output", "")
    researcher_json = state.get("researcher_json", {}) or {}

    events.append({
        "agent": "investigator", "type": "thinking",
        "content": "Tracing connections between key entities...",
        "tool_name": None, "tool_input": None,
    })

    # ── Extract seed entities ──────────────────────────────────
    entities = []
    if researcher_json:
        entities = researcher_json.get("entities", [])[:6]
    if not entities and researcher_out:
        entities = _extract_entities_from_research(researcher_out)
    # Always include the question topic itself as a seed
    entities = [question[:60]] + entities if entities else [question[:60]]

    # ── Step 1: deep Wikipedia retrieval ──────────────────────
    # Fetch seed entities, then follow their links 2 levels deep.
    # This gives Claude a rich, layered knowledge base to work from.

    # Add connection hints as additional seed targets
    hint_topics = []
    for entity in entities[:3]:
        hints = get_connection_hints(entity)
        hint_topics.extend(hints[:2])

    all_seeds = list(dict.fromkeys(entities + hint_topics))[:8]  # dedupe, cap at 8

    wiki_context = ""
    if all_seeds:
        events.append({
            "agent": "investigator", "type": "tool_call",
            "content": f"Deep retrieval: {', '.join(all_seeds[:4])} + linked articles (2 levels)",
            "tool_name": "deep_wikipedia_retrieval",
            "tool_input": {"seeds": all_seeds[:4], "depth": 2},
        })

        retrieval = await deep_wikipedia_retrieval(
            seed_entities=all_seeds,
            depth=2,          # seed → linked articles → their links
            max_articles=20,  # cap to keep tokens manageable
        )

        wiki_context = format_deep_context(retrieval, max_chars=4000)

        events.append({
            "agent": "investigator", "type": "tool_result",
            "content": f"Retrieved {retrieval['total_fetched']} Wikipedia articles across 2 levels",
            "tool_name": "deep_wikipedia_retrieval",
            "tool_input": None,
        })

    # ── Step 2: build the connections with Claude ──────────────
    hint_section = ""
    if hint_topics:
        hint_section = f"\nRELATED TOPICS TO CONSIDER: {', '.join(set(hint_topics))}\n"

    wiki_section = ""
    if wiki_context:
        wiki_section = f"\nWIKIPEDIA CONTEXT:\n{wiki_context}\n"

    prompt = f"""Question: {question}

HISTORIAN'S RESEARCH:
{researcher_out[:1200]}
{wiki_section}{hint_section}
Map the key connections. Write 2-3 paragraphs of analysis, then output the pi_board JSON block."""

    response = create_with_retry(
        client,
        model=settings.ANTHROPIC_AI_MODEL,
        max_tokens=1800,
        system=INVESTIGATOR_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    output = ""
    for block in response.content:
        if hasattr(block, "text"):
            output = block.text
            break

    events.append({
        "agent": "investigator", "type": "output",
        "content": output[:300] + ("..." if len(output) > 300 else ""),
        "tool_name": None, "tool_input": None,
    })

    return {
        "investigator_output": output,
        "connector_output":    output,   # compat alias for frontend
        "events":              events,
        "current_agent":       "visualizer",
    }


# Keep old name working — graph.py may import either
run_connector = run_investigator