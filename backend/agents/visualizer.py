"""The Visualizer Agent — fetches or generates accurate visuals, subject-aware"""

import json
import httpx
import os
import anthropic
from utils import create_with_retry
from tools.external_apis import generate_image, fetch_node_image
from subjects.configs import SubjectConfig
from core.config import settings

# ── WEB IMAGE SEARCH ──────────────────────────────────────────
# Try to find existing accurate images before generating (cheaper).
# Uses Wikimedia Commons API — free, no API key, high-quality educational images.
async def search_wikimedia_image(query: str) -> dict:
    """
    Search Wikimedia Commons for an existing image.
    Returns image URL + attribution or empty if not found.
    Free, no API key, licensed for educational use.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action":      "query",
                    "generator":   "search",
                    "gsrsearch":   f"file: {query}",
                    "gsrnamespace": 6,
                    "gsrlimit":    3,
                    "prop":        "imageinfo",
                    "iiprop":      "url|extmetadata",
                    "iiurlwidth":  800,
                    "format":      "json",
                    "origin":      "*",
                },
            )
            if resp.status_code != 200:
                return {}
            data  = resp.json()
            pages = data.get("query", {}).get("pages", {})
            for page in pages.values():
                info = page.get("imageinfo", [{}])[0]
                url  = info.get("thumburl") or info.get("url", "")
                meta = info.get("extmetadata", {})
                if url and url.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    return {
                        "url":         url,
                        "title":       page.get("title", "").replace("File:", ""),
                        "description": meta.get("ImageDescription", {}).get("value", "")[:200],
                        "license":     meta.get("LicenseShortName", {}).get("value", ""),
                        "attribution": meta.get("Attribution", {}).get("value", ""),
                        "source":      "Wikimedia Commons",
                    }
    except Exception:
        pass
    return {}


SYSTEM_TEMPLATE = """You are The Visualizer for the Severus Universal Learning Engine.

Subject: {subject_label}
Visualizer mode: {visualizer_mode}

{mode_instructions}

Always specify: accurate period or scientific details, correct representation of the people and places involved."""

MODE_INSTRUCTIONS = {
    "historical_image": (
        "Create 2 accurate visual reconstructions of this topic:\n"
        "1. A wide establishing scene showing the setting in its historical context\n"
        "2. A key moment involving the people or events discussed\n"
        "Requirements: accurate period clothing, architecture, and tools for the specific culture and era. "
        "Accurate representation of all peoples depicted. No anachronisms. No invented details."
    ),
    "diagram": (
        "Create 1 clear educational diagram of this concept or process:\n"
        "Describe a clean diagram with accurate labels, flow direction, and key components. "
        "Style: clear, accurate, educational. Suitable for a university textbook."
    ),
    "none": (
        "No visual generation needed for this subject. "
        "If a diagram would aid understanding, briefly describe what it would show."
    ),
}

TOOLS = [
    {
        "name": "search_wikimedia",
        "description": (
            "Search Wikimedia Commons for an existing accurate image. "
            "Always try this FIRST before generating — it is free and returns real photographs and illustrations."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Descriptive search query, e.g. 'Roman Forum ancient Rome' or 'photosynthesis diagram'"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "generate_image",
        "description": (
            "Generate an accurate image using Imagen 4. "
            "Use this only if Wikimedia search returns nothing relevant."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "prompt":       {"type": "string", "description": "Detailed, accurate scene description"},
                "style":        {"type": "string", "enum": ["photorealistic", "painterly", "technical_illustration"]},
                "aspect_ratio": {"type": "string", "enum": ["16:9", "1:1", "4:3"]},
            },
            "required": ["prompt"],
        },
    },
    # Video generation — kept for future use, currently disabled
    # Veo 3.1 max is 8 seconds which is insufficient for educational content
    # Will re-enable when longer-form video generation is available
    # {
    #     "name": "generate_video_prompt",
    #     "description": "Generate a video prompt. DISABLED — future feature.",
    #     ...
    # },
]


async def _run_tool(name: str, inputs: dict, subject_id: str = "history") -> str:
    try:
        if name == "search_wikimedia":
            # Use the new fetch_node_image which tries Wikipedia → Wikimedia → Imagen
            query = inputs.get("query", "")
            result = await fetch_node_image(query, node_type="event")
        elif name == "generate_image":
            result = await generate_image(
                prompt=inputs.get("prompt", ""),
                style=inputs.get("style", "photorealistic"),
                aspect_ratio=inputs.get("aspect_ratio", "16:9"),
                subject=subject_id,
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

    question        = state["question"]
    researcher_out  = state.get("researcher_output", "")
    researcher_json = state.get("researcher_json", {})
    subject_cfg: SubjectConfig = state.get("subject_config")

    visualizer_mode = subject_cfg.visualizer_mode if subject_cfg else "historical_image"
    subject_label   = subject_cfg.label if subject_cfg else "General"
    subject_id      = subject_cfg.id if subject_cfg else "history"

    events.append({
        "agent": "visualizer", "type": "thinking",
        "content": f"Generating {visualizer_mode} visuals...",
        "tool_name": None, "tool_input": None,
    })

    # Skip if subject doesn't need visuals
    if visualizer_mode == "none":
        return {
            "visualizer_output": {"scenes": [], "summary": ""},
            "events": events,
            "current_agent": "teacher",
        }

    system = SYSTEM_TEMPLATE.format(
        subject_label=subject_label,
        visualizer_mode=visualizer_mode,
        mode_instructions=MODE_INSTRUCTIONS.get(visualizer_mode, MODE_INSTRUCTIONS["historical_image"]),
    )

    # Use image_subject from researcher JSON if available
    image_hint = researcher_json.get("image_subject", "")
    num_visuals = "2 scenes" if visualizer_mode == "historical_image" else "1 diagram"
    context = (
        f"Question: {question}\n\n"
        f"{'Suggested visual: ' + image_hint if image_hint else ''}\n\n"
        f"Research context:\n{researcher_out[:600]}\n\n"
        f"Instructions:\n"
        f"1. Try search_wikimedia FIRST with a descriptive query.\n"
        f"2. Only use generate_image if Wikimedia returns nothing relevant.\n"
        f"3. Generate {num_visuals}."
    )

    messages = [{"role": "user", "content": context}]
    final_output = ""

    for _ in range(6):
        resp = create_with_retry(client,
            model=settings.ANTHROPIC_AI_MODEL,
            max_tokens=2000,
            system=system,
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
            preview = block.input.get("query", block.input.get("prompt", ""))[:80]
            events.append({
                "agent": "visualizer", "type": "tool_call",
                "content": f"{block.name}: {preview}...",
                "tool_name": block.name, "tool_input": block.input,
            })

            content = await _run_tool(block.name, block.input, subject_id)
            result  = json.loads(content)

            # Normalise scene type
            scene_type = "wikimedia_image" if block.name == "search_wikimedia" else block.name
            scenes.append({"type": scene_type, "input": block.input, "result": result})

            events.append({
                "agent": "visualizer", "type": "tool_result",
                "content": content[:400], "tool_name": block.name, "tool_input": None,
            })

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": content[:2000],
            })

        messages.append({"role": "user", "content": tool_results})

    if not final_output:
        final_output = f"Generated {len(scenes)} visual(s)."

    events.append({
        "agent": "visualizer", "type": "output",
        "content": final_output[:400], "tool_name": None, "tool_input": None,
    })

    return {
        "visualizer_output": {"scenes": scenes, "summary": final_output},
        "events":            events,
        "current_agent":     "teacher",
    }