"""
The Guide Agent
Synthesizes all agent outputs into a narrative journey.
Produces either a Teaser (punchy, 2–3 paragraphs) or
a Deep Dive (full documentary-style article).
"""

import anthropic
from utils import create_with_retry


GUIDE_TEASER_SYSTEM = """You are The Guide — the narrative synthesizer of the Severus African History Platform.

Your job: Synthesize research from The Historian, Investigator and Visualizer into a 
compelling SHORT narrative — like a documentary teaser or museum exhibit introduction.

Length: 2–4 paragraphs. Punchy. Memorable. Makes the reader want to know more.
Tone: Authoritative, engaging, slightly dramatic. Like a great museum exhibit caption.
Structure:
  1. Hook — a striking fact or moment that pulls the reader in
  2. Context — brief historical setting
  3. The twist / hidden truth — what most people don't know
  4. The resonance — why it matters today

Always write in present tense for historical moments (e.g., "It is 1324. Mansa Musa rides...")
"""

GUIDE_DEEP_DIVE_SYSTEM = """You are The Guide — the narrative synthesizer of the Severus African History Platform.

Your job: Synthesize research into a LONG-FORM documentary-style narrative article.

Length: 8–12 paragraphs. Thorough. Sourced. Tells the complete story.
Tone: BBC documentary meets academic journal. Accessible but rigorous.
Structure:
  1. Opening scene — place the reader in a specific moment
  2. Historical context — how did we get here?
  3. The main story — the full account with key figures and events
  4. The hidden connections — what the Investigator found
  5. The visual legacy — what these places and people looked like
  6. The accountability — who profited? Who still does?
  7. The diaspora thread — how this story lives on today
  8. Closing reflection — why this matters

Use headers. Use specific names, dates and places throughout.
"""


async def run_guide(state: dict) -> dict:
    """Run the Guide agent to synthesize a final narrative."""
    client = anthropic.Anthropic()
    events = []

    depth = state.get("narrative_depth", "teaser")
    question = state["question"]
    historian = state.get("historian_output", "")
    investigator = state.get("investigator_output", "")
    visualizer = state.get("visualizer_output", {})

    depth_label = "Teaser" if depth == "teaser" else "Deep Dive"

    events.append({
        "agent": "guide",
        "type": "thinking",
        "content": f"Synthesizing all findings into a {depth_label} narrative...",
        "tool_name": None,
        "tool_input": None,
    })

    # Build synthesis prompt
    visual_summary = ""
    if visualizer and visualizer.get("scenes"):
        visual_summary = f"\n\nVisual scenes generated: {len(visualizer['scenes'])} scene(s)\n"
        for scene in visualizer["scenes"][:3]:
            if scene.get("type") == "image":
                visual_summary += f"- Image: {scene.get('prompt', '')[:100]}\n"
            elif scene.get("type") == "video":
                visual_summary += f"- Video: {scene.get('scene', '')[:100]}\n"

    prompt = f"""
Question asked: {question}

Research gathered:

THE HISTORIAN found:
{historian[:800]}

THE INVESTIGATOR traced:
{investigator[:800]}

{visual_summary}

Now write a {depth_label.upper()} narrative that weaves all of this together.
"""

    system = GUIDE_TEASER_SYSTEM if depth == "teaser" else GUIDE_DEEP_DIVE_SYSTEM

    response = create_with_retry(client, 
        model="claude-sonnet-4-20250514",
        max_tokens=3000 if depth == "deep_dive" else 800,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    narrative = ""
    for block in response.content:
        if hasattr(block, "text"):
            narrative = block.text
            break

    events.append({
        "agent": "guide",
        "type": "output",
        "content": narrative[:300] + ("..." if len(narrative) > 300 else ""),
        "tool_name": None,
        "tool_input": None,
    })

    return {
        "guide_narrative": narrative,
        "events": events,
        "current_agent": "complete",
        "completed": True,
    }