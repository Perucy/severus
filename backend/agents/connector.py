"""The Investigator Agent — traces connections and accountability"""

import json
import anthropic
from utils import create_with_retry
from tools.external_apis import search_slavevoyages
from tools.knowledge_base import search_knowledge_base, get_connections
from core.config import settings

SYSTEM = """You are The Investigator for the Severus World History Platform.

Your job:
1. Answer the SPECIFIC question asked — trace connections DIRECTLY relevant to it.
2. At the END of your response, output a JSON block for the PI board.

RULES:
- Answer the specific question first with full detail.
- For art/culture questions (bronzes, artifacts): trace who has them, museums, repatriation status.
- For empire/civilization questions: trace trade connections, key figures, legacy.
- For accountability questions: trace financial institutions, families, modern legacy.
- ONLY bring in slave trade / RAC / Lloyd's if the question is explicitly about the slave trade.
- Be specific: real names, real institutions, real dates.

PI BOARD JSON FORMAT — always end your response with this exact block:

```pi_board
{
  "nodes": [
    {"id": "node-1", "label": "Kingdom of Benin", "type": "place"},
    {"id": "node-2", "label": "British Museum", "type": "institution"},
    {"id": "node-3", "label": "1897 Expedition", "type": "event"}
  ],
  "edges": [
    {"from": "node-1", "to": "node-2", "label": "Looted by"},
    {"from": "node-3", "to": "node-1", "label": "Attacked"}
  ]
}
```

Node types: person, place, event, institution, trade, ship, document
Use 5-10 nodes maximum. Only include what is directly relevant to the question.
The nodes and edges should tell the CONNECTION STORY of the question asked."""

TOOLS = [
    {
        "name": "search_slavevoyages",
        "description": "Query the SlaveVoyages.org Trans-Atlantic Slave Trade Database.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "ship_name": {"type": "string"},
                "year_from": {"type": "integer"},
                "year_to": {"type": "integer"},
            },
            "required": [],
        },
    },
    {
        "name": "search_severus_kb",
        "description": "Search Severus knowledge base for connections and accountability records.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "category": {"type": "string", "enum": ["all","locations","people","events"]}
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_node_connections",
        "description": "Trace all connections for a historical entity. Node IDs: mali, egypt, kush, benin, rac, lloyds, ouidah, berlin, leopold, caribbean, usa, brazil.",
        "input_schema": {
            "type": "object",
            "properties": {"node_id": {"type": "string"}},
            "required": ["node_id"],
        },
    },
]

async def _run_tool(name: str, inputs: dict) -> str:
    try:
        if name == "search_slavevoyages":
            result = await search_slavevoyages(
                query=inputs.get("query"),
                ship_name=inputs.get("ship_name"),
                year_from=inputs.get("year_from"),
                year_to=inputs.get("year_to"),
            )
        elif name == "search_severus_kb":
            result = search_knowledge_base(inputs.get("query",""), inputs.get("category","all"))
        elif name == "get_node_connections":
            result = get_connections(inputs.get("node_id",""))
        else:
            result = {"error": f"Unknown tool: {name}"}
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})

async def run_investigator(state: dict) -> dict:
    client = anthropic.Anthropic()
    events = []
    question    = state["question"]
    historian   = state.get("historian_output","")

    events.append({"agent":"investigator","type":"thinking",
        "content":"Tracing connections — following money, lineage, and accountability chains...",
        "tool_name":None,"tool_input":None})

    messages = [{"role":"user","content":(
        f"Question: {question}\n\n"
        f"The Historian found:\n{historian[:2000]}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. Search the Severus KB for the SPECIFIC entities mentioned in the historian's research above.\n"
        f"   For example: if the historian mentions 'Benin Bronzes', search for 'benin bronzes', 'british museum', '1897 expedition'.\n"
        f"   If the historian mentions 'Mali Empire', search for 'mali', 'mansa musa', 'timbuktu'.\n"
        f"2. Use get_node_connections ONLY for nodes that are DIRECTLY about the question topic.\n"
        f"3. Do NOT search for 'Royal African Company', 'Lloyd's', 'Berlin Conference', 'Ouidah', or slave trade\n"
        f"   UNLESS the question is specifically about the slave trade or colonial economics.\n"
        f"4. For art/culture questions: focus on institutions holding the objects, legal battles, repatriation.\n"
        f"5. For empire/civilization questions: focus on the empire's connections, trade partners, legacy.\n"
        f"6. For accountability questions: then YES trace financial/colonial institutions.\n"
        f"7. Answer: what are the specific connections, who is responsible, what is the modern status?"
    )}]

    final_output = ""

    for _ in range(8):
        resp = create_with_retry(client, 
            model=settings.ANTHROPIC_AI_MODEL,
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
            events.append({"agent":"investigator","type":"tool_call",
                "content":f"Calling {block.name}: {json.dumps(block.input)[:80]}",
                "tool_name":block.name,"tool_input":block.input})

            content = await _run_tool(block.name, block.input)

            events.append({"agent":"investigator","type":"tool_result",
                "content":content[:500],"tool_name":block.name,"tool_input":None})

            tool_results.append({
                "type":"tool_result",
                "tool_use_id":block.id,
                "content":content[:2000],
            })

        messages.append({"role":"user","content":tool_results})

    if not final_output:
        final_output = "Investigation complete — connections mapped."

    events.append({"agent":"investigator","type":"output",
        "content":final_output[:400]+"..." if len(final_output)>400 else final_output,
        "tool_name":None,"tool_input":None})

    return {"investigator_output":final_output,"events":events,"current_agent":"visualizer"}