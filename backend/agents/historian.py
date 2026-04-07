"""The Historian Agent — searches Wikipedia and Severus KB"""

import json
import anthropic
from utils import create_with_retry
from tools.external_apis import search_wikipedia
from tools.knowledge_base import get_connection_hints

SYSTEM = """You are The Historian for the Severus World History Platform.

You answer questions about ANY topic in world history — African civilisations, European empires, Asian dynasties, Indigenous peoples, the Americas, the Middle East, the Silk Road, colonialism, resistance movements, modern history.

Be specific: real names, real dates, real places. Cite sources.
Surface facts typically excluded from mainstream education.
Format your response with: key facts, timeline, important figures, sources."""

TOOLS = [
    {
        "name": "search_wikipedia",
        "description": "Search Wikipedia for historical information.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "search_severus_kb",
        "description": "Search the Severus African history knowledge base.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "category": {"type": "string", "enum": ["all","locations","people","events"]}
            },
            "required": ["query"],
        },
    },
]

async def _run_tool(name: str, inputs: dict) -> str:
    try:
        if name == "search_wikipedia":
            result = await search_wikipedia(inputs.get("query",""))
        elif name == "search_severus_kb":
            result = get_connection_hints(inputs.get("query",""))
        else:
            result = {"error": f"Unknown tool: {name}"}
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})

async def run_historian(state: dict) -> dict:
    client = anthropic.Anthropic()
    events = []
    question = state["question"]

    events.append({"agent":"historian","type":"thinking",
        "content":f"Researching '{question}'...","tool_name":None,"tool_input":None})

    messages = [{"role":"user","content":(
        f"Research this thoroughly: {question}\n"
        "Use search_wikipedia and search_severus_kb. Find key facts, figures, and dates."
    )}]

    final_output = ""

    for _ in range(8):
        resp = create_with_retry(client, 
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=SYSTEM,
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role":"assistant","content":resp.content})

        tool_uses = [b for b in resp.content if b.type == "tool_use"]
        texts     = [b for b in resp.content if hasattr(b,"text")]

        if resp.stop_reason == "end_turn" or not tool_uses:
            if texts:
                final_output = texts[0].text
            break

        tool_results = []
        for block in tool_uses:
            events.append({"agent":"historian","type":"tool_call",
                "content": f"Searching: {block.input.get('query','')}",
                "tool_name":block.name,"tool_input":block.input})

            content = await _run_tool(block.name, block.input)

            events.append({"agent":"historian","type":"tool_result",
                "content":content[:500],"tool_name":block.name,"tool_input":None})

            tool_results.append({
                "type":"tool_result",
                "tool_use_id":block.id,
                "content":content[:2000],
            })

        messages.append({"role":"user","content":tool_results})

    if not final_output:
        final_output = "Historian research complete."

    events.append({"agent":"historian","type":"output",
        "content":final_output[:400]+"..." if len(final_output)>400 else final_output,
        "tool_name":None,"tool_input":None})

    return {"historian_output":final_output,"events":events,"current_agent":"investigator"}