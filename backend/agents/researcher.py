"""
The Researcher Agent (formerly Historian)
Universal — works for history, science, econ, law.
Outputs structured JSON for downstream agents.
"""

import json
import anthropic
from utils import create_with_retry
from tools.external_apis import search_web, search_wikipedia
from subjects.configs import SubjectConfig
from core.config import settings


SYSTEM_TEMPLATE = """You are The Researcher for the Severus Universal Learning Engine.

Subject: {subject_label}
Teaching approach: {teacher_style}

Your job is to find accurate, specific, well-sourced information that gives a student genuine understanding of the topic — not a surface-level summary.

RULES:
1. Be specific. Real names, real dates, real numbers. Not "many people" but "2.3 million people".
2. Go beyond the obvious. Find the detail, the nuance, or the angle that most introductions miss.
3. Use web_search first for current and specific information. Use search_wikipedia for structured facts and timelines.
4. Cover all regions, cultures, and perspectives relevant to the question — do not centre any single tradition.
5. If the student has prior knowledge, explicitly connect this topic to what they already know.
6. Do 2 to 3 searches maximum. Make them count.

{researcher_hints}

Output your final response as structured JSON only:

{{
  "key_facts": ["fact 1", "fact 2", "fact 3"],
  "timeline": ["date: event", "date: event"],
  "key_figures": [{{"name": "...", "role": "...", "significance": "..."}}],
  "prior_knowledge_connection": "...",
  "entities": ["entity1", "entity2"],
  "image_subject": "one sentence describing the most instructive scene or diagram to visualise",
  "source": "primary source or Wikipedia article title"
}}

Return ONLY valid JSON. No prose before or after."""


TOOLS = [
    {
        "name": "search_web",
        "description": "Search the web for accurate, current information on any topic across any subject.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Specific search query"},
                "max_results": {"type": "integer", "default": 5},
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_wikipedia",
        "description": "Search Wikipedia for structured information — timelines, key figures, definitions, and overviews across all subjects.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
]


async def _run_tool(name: str, inputs: dict) -> str:
    try:
        if name == "search_web":
            result = await search_web(inputs.get("query", ""), inputs.get("max_results", 5))
        elif name == "search_wikipedia":
            result = await search_wikipedia(inputs.get("query", ""))
        else:
            result = {"error": f"Unknown tool: {name}"}
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def run_researcher(state: dict) -> dict:
    client  = anthropic.Anthropic()
    events  = []
    question     = state["question"]
    subject_cfg: SubjectConfig = state.get("subject_config")
    past_context = state.get("past_context", "")
    prior_knowledge = state.get("prior_knowledge", "")

    events.append({
        "agent": "researcher", "type": "thinking",
        "content": f"Researching '{question}'...",
        "tool_name": None, "tool_input": None,
    })

    # Build system prompt from subject config
    system = SYSTEM_TEMPLATE.format(
        subject_label=subject_cfg.label if subject_cfg else "General",
        teacher_style=subject_cfg.teacher_style if subject_cfg else "socratic",
        researcher_hints=subject_cfg.researcher_hints if subject_cfg else "",
    )

    # Build memory context
    memory_block = ""
    if prior_knowledge:
        memory_block = (
            f"\n\nSTUDENT PRIOR KNOWLEDGE:\n"
            f"This student has previously studied:\n{prior_knowledge}\n"
            f"Where relevant, explicitly connect this topic to their prior knowledge "
            f"in the 'prior_knowledge_connection' field of your JSON output.\n"
        )
    elif past_context:
        memory_block = (
            f"\n\nSTUDENT PRIOR CONTEXT:\n{past_context}\n"
        )

    messages = [{
        "role": "user",
        "content": (
            f"Question: {question}\n{memory_block}\n"
            f"Search for specific, surprising facts. 2-3 searches maximum. "
            f"Return your findings as structured JSON."
        ),
    }]

    raw_output = ""

    for _ in range(6):
        resp = create_with_retry(
            client,
            model=settings.ANTHROPIC_AI_MODEL,
            max_tokens=1200,
            system=system,
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": resp.content})

        tool_uses = [b for b in resp.content if b.type == "tool_use"]
        texts     = [b for b in resp.content if hasattr(b, "text")]

        if resp.stop_reason == "end_turn" or not tool_uses:
            if texts:
                raw_output = texts[0].text
            break

        tool_results = []
        for block in tool_uses:
            events.append({
                "agent": "researcher", "type": "tool_call",
                "content": f"{block.name}: {block.input.get('query', '')}",
                "tool_name": block.name, "tool_input": block.input,
            })

            content = await _run_tool(block.name, block.input)

            events.append({
                "agent": "researcher", "type": "tool_result",
                "content": content[:400],
                "tool_name": block.name, "tool_input": None,
            })

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": content[:1500],
            })

        messages.append({"role": "user", "content": tool_results})

    # Parse JSON output
    structured_output = {}
    display_output    = raw_output

    try:
        # Strip code fences if present
        clean = raw_output.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        structured_output = json.loads(clean.strip())

        # Build display-friendly text from structured JSON
        parts = []
        if structured_output.get("key_facts"):
            parts.append("KEY FACTS\n" + "\n".join(f"• {f}" for f in structured_output["key_facts"]))
        if structured_output.get("timeline"):
            parts.append("TIMELINE\n" + "\n".join(f"• {t}" for t in structured_output["timeline"]))
        if structured_output.get("key_figures"):
            figs = structured_output["key_figures"]
            parts.append("KEY FIGURES\n" + "\n".join(
                f"• {f['name']} — {f.get('role', '')} — {f.get('significance', '')}"
                for f in figs
            ))
        if structured_output.get("prior_knowledge_connection"):
            parts.append(f"CONNECTS TO YOUR PRIOR STUDY\n{structured_output['prior_knowledge_connection']}")
        if structured_output.get("source"):
            parts.append(f"SOURCE: {structured_output['source']}")
        display_output = "\n\n".join(parts) if parts else raw_output

    except Exception:
        # Not valid JSON — use raw output as display, build empty structured
        structured_output = {
            "key_facts": [],
            "entities": [],
            "image_subject": question,
        }

    events.append({
        "agent": "researcher", "type": "output",
        "content": display_output[:400] + "..." if len(display_output) > 400 else display_output,
        "tool_name": None, "tool_input": None,
    })

    return {
        "researcher_output":    display_output,
        "researcher_json":      structured_output,
        "events":               events,
        "current_agent":        "connector",
    }