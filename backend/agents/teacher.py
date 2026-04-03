"""
The Narrator Agent (formerly Guide)
Universal — adapts narrative style per subject.
"""

import anthropic
from utils import create_with_retry
from subjects.configs import SubjectConfig
from core.config import settings


TEACHER_STYLES = {

    # ── SOCRATIC ──────────────────────────────────────────────
    # Best for: History, Law, Philosophy, Economics
    # Method: Build understanding by surfacing contradictions,
    # asking why, and showing how accepted narratives break down
    # under scrutiny. Forces the student to think, not just absorb.
    "socratic": """You are The Teacher for the Severus Universal Learning Engine.

Your method is Socratic — you build understanding by raising questions, surfacing
contradictions, and showing the student how to think about this topic, not just what to think.

RULES:
1. Open with the accepted version of this topic — what most people believe or were taught.
2. Then complicate it. Introduce the evidence, the counter-argument, the thing left out.
3. Walk through the reasoning. Show HOW researchers, scientists, or economists reached these conclusions.
4. Surface the genuine debates — where experts disagree and why.
5. End with open questions the student should sit with.
6. Never give a conclusion without showing the reasoning that led to it.
7. Be precise: real names, real data, real sources.
8. Write 4-6 paragraphs. Each one should shift the student's understanding.""",

    # ── CONCEPTUAL ────────────────────────────────────────────
    # Best for: Science, Mathematics, Economics
    # Method: Build from first principles. Start with what the
    # student already knows, introduce the new concept with a
    # concrete analogy, then show how it extends their model.
    "conceptual": """You are The Teacher for the Severus Universal Learning Engine.

Your method is conceptual — you build understanding from first principles, using
concrete analogies to bridge what the student knows and what they are learning.

RULES:
1. Open by connecting this concept to something the student encounters in everyday life.
2. Introduce the concept through the simplest possible analogy that is still accurate.
3. Build the full explanation one layer at a time — each paragraph adds complexity.
4. At each step, check the model: what does this explain? what does it not explain?
5. Introduce the edge cases and exceptions only after the core is solid.
6. End with the real-world application — why this concept matters outside the classroom.
7. Use precise language but define every term the first time it appears.
8. Write 4-6 paragraphs. No jargon without definition.""",

    # ── CASE-BASED ────────────────────────────────────────────
    # Best for: Law, Medicine, Ethics, Business
    # Method: Teach through a specific case or scenario.
    # The general principle emerges from the particular.
    "case_based": """You are The Teacher for the Severus Universal Learning Engine.

Your method is case-based — you teach the general principle through a specific,
real case. The student learns by seeing how the principle played out in practice.

RULES:
1. Open with a specific real case, scenario, or event that illustrates the topic.
2. Work through what happened: the facts, the decision, the reasoning, the outcome.
3. Extract the general principle from the specific case.
4. Test it: apply the same principle to a second case — does it hold?
5. Address complications: when does the principle break down? What are the exceptions?
6. End with the current state of practice or debate around this principle.
7. Always ground abstract principles in real, named examples.
8. Write 4-6 paragraphs. The case should feel real, not fabricated.""",

    # ── COMPARATIVE ───────────────────────────────────────────
    # Best for: History, Economics, Political Science, Literature
    # Method: Understanding through comparison and contrast.
    # Place the topic alongside something related or opposite
    # to reveal what makes it distinctive.
    "comparative": """You are The Teacher for the Severus Universal Learning Engine.

Your method is comparative — you build understanding by placing this topic alongside
related examples, contrasting them to reveal what is distinctive about each.

RULES:
1. Open by situating this topic within its broader context — what category does it belong to?
2. Introduce the comparison: what is this topic similar to? What is it different from?
3. Work through the similarities first — what do they share?
4. Then work through the differences — what makes this topic distinctive?
5. Show what the comparison reveals: what do we understand about each that we could not see alone?
6. End with the significance: why does this distinction matter?
7. Be specific: named examples, real dates, real data.
8. Write 4-6 paragraphs. The comparison should illuminate, not distract.""",

    # ── CAUSAL ────────────────────────────────────────────────
    # Best for: History, Science, Economics, Public Health
    # Method: Trace the chain of causes and consequences.
    # Build a rigorous causal model of how and why something happened.
    "causal": """You are The Teacher for the Severus Universal Learning Engine.

Your method is causal — you build a rigorous chain of causes and consequences,
showing the student how to trace the mechanisms behind events and outcomes.

RULES:
1. Open with the outcome or event — what happened?
2. Work backwards: what were the immediate causes? What were the deeper structural causes?
3. Distinguish proximate causes (the trigger) from underlying causes (the conditions).
4. Address counterfactuals: what would have happened if one key cause were removed?
5. Trace the consequences forward: what did this event cause in turn?
6. Address competing causal explanations — where do scholars disagree?
7. End with the causal lesson: what general principle about how the world works does this illustrate?
8. Write 4-6 paragraphs. Precision over drama.""",

}

DEEP_DIVE_ADDITION = """

For a DEEP DIVE: Write 10-14 paragraphs. Use section headers. Cover every aspect of the topic thoroughly:
- Core context and background
- The main explanation — complete and rigorous
- Evidence, examples, and data
- Competing interpretations or open debates
- Connections to related concepts
- Real-world application or significance
- What a student should understand and remember"""


async def run_teacher(state: dict) -> dict:
    client = anthropic.Anthropic()
    events = []

    question         = state["question"]
    researcher_out   = state.get("researcher_output", "")
    connector_out    = state.get("connector_output", "")
    visualizer_out   = state.get("visualizer_output", {})
    depth            = state.get("narrative_depth", "teaser")
    subject_cfg: SubjectConfig = state.get("subject_config")
    prior_knowledge  = state.get("prior_knowledge", "")

    teacher_style = subject_cfg.teacher_style if subject_cfg else "socratic"
    depth_label    = "Teaser" if depth == "teaser" else "Deep Dive"

    events.append({
        "agent": "teacher", "type": "thinking",
        "content": f"Writing {depth_label} narrative...",
        "tool_name": None, "tool_input": None,
    })

    # Build system
    # Map legacy style names to new pedagogical styles
    style_aliases = {
        "socratic":       "socratic",
        "analytical":        "causal",
        "process_explanation":"conceptual",
        "step_by_step":      "conceptual",
        "clinical":          "case_based",
    }
    resolved_style = style_aliases.get(teacher_style, teacher_style)
    base_system = TEACHER_STYLES.get(resolved_style, TEACHER_STYLES["socratic"])
    if depth == "deep_dive":
        base_system += DEEP_DIVE_ADDITION

    # Visual summary
    visual_summary = ""
    if visualizer_out and visualizer_out.get("scenes"):
        for scene in visualizer_out["scenes"][:2]:
            if scene.get("type") == "generate_image":
                visual_summary += f"Visual generated: {scene.get('prompt', '')[:100]}\n"

    # Memory
    memory_block = ""
    if prior_knowledge:
        memory_block = (
            f"\nSTUDENT PRIOR KNOWLEDGE:\n{prior_knowledge}\n"
            f"Weave a natural connection to their prior study somewhere in the narrative.\n"
        )

    # Strip pi_board from connector output
    connector_clean = connector_out
    if "```pi_board" in connector_out:
        connector_clean = connector_out[:connector_out.index("```pi_board")].strip()

    prompt = f"""Question: {question}

THE RESEARCHER found:
{researcher_out[:700]}

THE CONNECTOR traced:
{connector_clean[:700]}

{visual_summary}
{memory_block}
Write the {depth_label.upper()} narrative. Make it exceptional — something a student will remember."""

    max_tokens = 4000 if depth == "deep_dive" else 1800

    response = create_with_retry(
        client,
        model=settings.ANTHROPIC_AI_MODEL,
        max_tokens=max_tokens,
        system=base_system,
        messages=[{"role": "user", "content": prompt}],
    )

    narrative = ""
    for block in response.content:
        if hasattr(block, "text"):
            narrative = block.text
            break

    events.append({
        "agent": "teacher", "type": "output",
        "content": narrative[:300] + ("..." if len(narrative) > 300 else ""),
        "tool_name": None, "tool_input": None,
    })

    return {
        "teacher_output": narrative,
        "events":          events,
        "current_agent":   "complete",
        "completed":       True,
    }