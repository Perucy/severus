"""
The Connector Agent (formerly Investigator)
Traces connections SPECIFIC to the question asked.
Entity-driven — works from the Researcher's JSON output.
Outputs pi_board JSON for the investigation board.
"""

import json
import anthropic
from utils import create_with_retry
from tools.external_apis import search_web
from tools.knowledge_base import search_knowledge_base, get_connections
from subjects.configs import SubjectConfig
from core.config import settings


SYSTEM_TEMPLATE = """You are The Connector for the Severus Universal Learning Engine.

Subject: {subject_label}

Your job is to trace the specific connections, causes, institutions, and modern relevance of the topic the student asked about.

RULES:
1. Work from the entity list the Researcher identified. Investigate those entities specifically.
2. Find: what is connected, who was involved, what institutions shaped this, what is the present-day relevance.
3. Be specific — real names, real institutions, real consequences.
4. Stay tight — 3 to 5 key connections maximum, directly relevant to the question.
5. For history: trace legacy and accountability. For science: trace applications and consequences.
   For economics: trace causes, beneficiaries, and policy implications. For law: trace precedents and real-world impact.
6. {connector_hints}

END your response with a pi_board JSON block:

```pi_board
{{
  "nodes": [
    {{"id": "n1", "label": "...", "type": "place|person|event|institution|trade|concept"}}
  ],
  "edges": [
    {{"from": "n1", "to": "n2", "label": "2-4 word relationship"}}
  ]
}}
```

Use 5 to 8 nodes maximum. Only include what is directly relevant to the question."""


TOOLS = [
    {
        "name": "search_web",
        "description": "Search the web for connections, modern legacy, and accountability trails.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "max_results": {"type": "integer", "default": 3},
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_severus_kb",
        "description": "Search the Severus knowledge base for entity connections.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "category": {"type": "string", "enum": ["all", "locations", "people", "events"]},
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_node_connections",
        "description": "Get direct connections for a specific entity in the Severus knowledge graph.",
        "input_schema": {
            "type": "object",
            "properties": {"node_id": {"type": "string"}},
            "required": ["node_id"],
        },
    },
]


async def _run_tool(name: str, inputs: dict) -> str:
    try:
        if name == "search_web":
            result = await search_web(inputs.get("query", ""), inputs.get("max_results", 3))
        elif name == "search_severus_kb":
            result = search_knowledge_base(inputs.get("query", ""), inputs.get("category", "all"))
        elif name == "get_node_connections":
            result = get_connections(inputs.get("node_id", ""))
        else:
            result = {"error": f"Unknown tool: {name}"}
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def run_connector(state: dict) -> dict:
    client = anthropic.Anthropic()
    events = []

    question        = state["question"]
    researcher_json = state.get("researcher_json", {})
    researcher_out  = state.get("researcher_output", "")
    subject_cfg: SubjectConfig = state.get("subject_config")

    events.append({
        "agent": "connector", "type": "thinking",
        "content": f"Tracing connections for '{question}'...",
        "tool_name": None, "tool_input": None,
    })

    system = SYSTEM_TEMPLATE.format(
        subject_label=subject_cfg.label if subject_cfg else "General",
        connector_hints=subject_cfg.connector_hints if subject_cfg else "",
    )

    # Build entity list from researcher JSON
    entities = researcher_json.get("entities", [])
    entity_str = ", ".join(entities) if entities else "entities from the researcher output"

    messages = [{
        "role": "user",
        "content": (
            f"Question: {question}\n\n"
            f"The Researcher found these key entities: {entity_str}\n\n"
            f"Researcher summary:\n{researcher_out[:1000]}\n\n"
            f"INSTRUCTIONS:\n"
            f"1. Use search_web and search_severus_kb to find connections for: {entity_str}\n"
            f"2. Investigate 3-5 key connections directly relevant to this specific question.\n"
            f"3. End with a pi_board JSON block.\n"
        ),
    }]

    final_output = ""

    for _ in range(6):
        resp = create_with_retry(
            client,
            model=settings.ANTHROPIC_AI_MODEL,
            max_tokens=1500,
            system=system,
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": resp.content})

        tool_uses = [b for b in resp.content if b.type == "tool_use"]
        texts     = [b for b in resp.content if hasattr(b, "text")]

        if resp.stop_reason == "end_turn" or not tool_uses:
            if texts:
                final_output = texts[0].text
            break

        tool_results = []
        for block in tool_uses:
            events.append({
                "agent": "connector", "type": "tool_call",
                "content": f"{block.name}: {json.dumps(block.input)[:100]}",
                "tool_name": block.name, "tool_input": block.input,
            })

            content = await _run_tool(block.name, block.input)

            events.append({
                "agent": "connector", "type": "tool_result",
                "content": content[:400],
                "tool_name": block.name, "tool_input": None,
            })

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": content[:1500],
            })

        messages.append({"role": "user", "content": tool_results})

    if not final_output:
        final_output = "Investigation complete."

    events.append({
        "agent": "connector", "type": "output",
        "content": final_output[:400] + "..." if len(final_output) > 400 else final_output,
        "tool_name": None, "tool_input": None,
    })

    return {
        "connector_output": final_output,
        "events":           events,
        "current_agent":    "visualizer",
    }