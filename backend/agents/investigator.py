"""The Investigator Agent — traces connections and accountability"""

import json
import anthropic
from utils import create_with_retry
from tools.external_apis import search_slavevoyages
from tools.knowledge_base import search_knowledge_base, get_connections

SYSTEM = """You are The Investigator for the Severus African History Platform.

Your PRIMARY job is to answer the SPECIFIC question asked — trace the connections DIRECTLY relevant to that question.

RULES:
1. Answer the specific question first. If asked about the Benin Bronzes, trace: who looted them, where they are now, which museums hold them, which families led the 1897 expedition, what repatriation demands exist.
2. Find connections IN THE SEVERUS KNOWLEDGE BASE that are directly related to the topic.
3. Only bring in slave trade / accountability connections if they are DIRECTLY relevant to the question asked.
4. Do NOT default to searching SlaveVoyages unless the question is about the slave trade.
5. Use get_node_connections only for nodes that are genuinely connected to the question topic.
6. Be specific: name real people, real institutions, real dates, real amounts.
7. Always explain WHY a connection matters to the specific question.

Format your output clearly with: direct connections, key figures involved, modern legacy, accountability trail."""

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