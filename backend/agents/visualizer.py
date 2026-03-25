"""The Visualizer Agent — generates images via Nano Banana Pro and video prompts"""

import json
import anthropic
from utils import create_with_retry
from tools.external_apis import generate_image, generate_video_prompt

SYSTEM = """You are The Visualizer for the Severus African History Platform.
Create vivid, historically accurate visual reconstructions.
Generate 2 scenes: one establishing shot, one key dramatic moment.
Prioritise authentic African aesthetics — correct period clothing, architecture, tools.
Always specify: lighting, mood, camera angle, cultural details."""

TOOLS = [
    {
        "name": "generate_image",
        "description": "Generate a historical image using Nano Banana Pro (Google Gemini 3 Pro Image).",
        "input_schema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Detailed historical scene"},
                "style": {"type": "string", "enum": ["photorealistic","painterly","documentary","editorial"]},
                "aspect_ratio": {"type": "string", "enum": ["16:9","1:1","4:3"]},
            },
            "required": ["prompt"],
        },
    },
    {
        "name": "generate_video_prompt",
        "description": "Create a documentary-style video prompt for historical reconstruction.",
        "input_schema": {
            "type": "object",
            "properties": {
                "scene_description": {"type": "string"},
                "duration": {"type": "string"},
            },
            "required": ["scene_description"],
        },
    },
]

async def _run_tool(name: str, inputs: dict) -> str:
    try:
        if name == "generate_image":
            result = await generate_image(
                prompt=inputs.get("prompt",""),
                style=inputs.get("style","photorealistic"),
                aspect_ratio=inputs.get("aspect_ratio","16:9"),
            )
        elif name == "generate_video_prompt":
            result = await generate_video_prompt(
                scene_description=inputs.get("scene_description",""),
                duration=inputs.get("duration","30 seconds"),
            )
        else:
            result = {"error": f"Unknown tool: {name}"}
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})

async def run_visualizer(state: dict) -> dict:
    client = anthropic.Anthropic()
    events = []
    scenes = []

    question    = state["question"]
    historian   = state.get("historian_output","")
    investigator = state.get("investigator_output","")

    events.append({"agent":"visualizer","type":"thinking",
        "content":"Designing visual reconstructions via Nano Banana Pro...",
        "tool_name":None,"tool_input":None})

    messages = [{"role":"user","content":(
        f"Question: {question}\n\n"
        f"Historical research:\n{historian[:600]}\n\n"
        f"Connections found:\n{investigator[:400]}\n\n"
        "Generate 2 visual scenes and 1 video prompt that bring this history to life. "
        "Be historically specific and visually compelling."
    )}]

    final_output = ""

    for _ in range(6):
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
            prompt_preview = block.input.get("prompt", block.input.get("scene_description",""))[:80]
            events.append({"agent":"visualizer","type":"tool_call",
                "content":f"Generating: {prompt_preview}...",
                "tool_name":block.name,"tool_input":block.input})

            content = await _run_tool(block.name, block.input)
            result  = json.loads(content)

            # Track scenes for the UI
            scenes.append({"type":block.name,"input":block.input,"result":result})

            events.append({"agent":"visualizer","type":"tool_result",
                "content":content[:400],"tool_name":block.name,"tool_input":None})

            tool_results.append({
                "type":"tool_result",
                "tool_use_id":block.id,
                "content":content[:2000],
            })

        messages.append({"role":"user","content":tool_results})

    if not final_output:
        final_output = f"Generated {len(scenes)} visual scene(s)."

    events.append({"agent":"visualizer","type":"output",
        "content":final_output[:400],"tool_name":None,"tool_input":None})

    return {
        "visualizer_output":{"scenes":scenes,"summary":final_output},
        "events":events,
        "current_agent":"guide",
    }