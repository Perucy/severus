"""
Subject configurations for the Severus Universal Learning Engine.

Each subject defines:
- tools: which research tools the Researcher agent can use
- visualizer_mode: what kind of image to generate (or skip)
- teacher_style: pedagogical approach — socratic | conceptual | case_based | comparative | causal
- question_types: how to classify incoming questions
- researcher_hints: extra instructions for the Researcher
- connector_hints: extra instructions for the Connector
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SubjectConfig:
    id: str
    label: str
    tools: list[str]
    visualizer_mode: str          # historical_image | diagram | none
    teacher_style: str           # socratic | conceptual | case_based | comparative | causal
    researcher_hints: str = ""
    connector_hints: str = ""


# ── HISTORY ───────────────────────────────────────────────────
HISTORY = SubjectConfig(
    id="history",
    label="History",
    tools=["web_search", "wikipedia"],
    visualizer_mode="historical_image",
    teacher_style="socratic",
    researcher_hints=(
        "Find specific dates, real names, real numbers. "
        "Surface facts that are often left out of mainstream education — "
        "across all civilisations, regions and time periods. "
        "Format: KEY FACTS, TIMELINE, KEY FIGURES, SOURCE."
    ),
    connector_hints=(
        "Trace the specific connections relevant to the question asked. "
        "Who was involved? What institutions? What is the modern legacy? "
        
        "Follow the question — not a default template."
    ),
)

# ── SCIENCE ───────────────────────────────────────────────────
SCIENCE = SubjectConfig(
    id="science",
    label="Science",
    tools=["web_search", "wikipedia"],
    visualizer_mode="diagram",
    teacher_style="conceptual",
    researcher_hints=(
        "Find the mechanism — how does it actually work step by step. "
        "Include: the process, the key components, the inputs and outputs, "
        "real-world examples, and why it matters. "
        "Format: MECHANISM, PROCESS STEPS, KEY COMPONENTS, REAL-WORLD APPLICATION, SOURCE."
    ),
    connector_hints=(
        "Trace the scientific connections. What does this process connect to? "
        "What does it enable? What breaks if it fails? "
        "Connect to real-world applications, medical implications, or technological uses."
    ),
)

# ── ECONOMICS ─────────────────────────────────────────────────
ECON = SubjectConfig(
    id="econ",
    label="Economics",
    tools=["web_search", "wikipedia"],
    visualizer_mode="none",
    teacher_style="causal",
    researcher_hints=(
        "Find the economic mechanism, the data, and the human consequences. "
        "Include: the concept, how it works in practice, historical examples, "
        "current relevance, key economists or institutions involved. "
        "Format: CONCEPT, HOW IT WORKS, HISTORICAL EXAMPLE, CURRENT RELEVANCE, SOURCE."
    ),
    connector_hints=(
        "Trace the economic connections and power structures. "
        "Who benefits? Who is harmed? What institutions are involved? "
        "Connect to current policy debates, wealth inequality, or global trade."
    ),
)

# ── LAW ───────────────────────────────────────────────────────
LAW = SubjectConfig(
    id="law",
    label="Law",
    tools=["web_search", "wikipedia"],
    visualizer_mode="none",
    teacher_style="case_based",
    researcher_hints=(
        "Find the legal principle, landmark cases, and practical application. "
        "Include: the rule/principle, its origin, key cases that defined it, "
        "how courts apply it today, exceptions and edge cases. "
        "Format: LEGAL PRINCIPLE, ORIGIN, KEY CASES, HOW IT APPLIES TODAY, EXCEPTIONS, SOURCE."
    ),
    connector_hints=(
        "Trace the legal connections and precedents. "
        "What cases built on this principle? What does it conflict with? "
        "How does this law affect ordinary people? What are the debates around it?"
    ),
)

# ── GENERIC FALLBACK ──────────────────────────────────────────
GENERIC = SubjectConfig(
    id="generic",
    label="General",
    tools=["web_search", "wikipedia"],
    visualizer_mode="none",
    teacher_style="socratic",
    researcher_hints=(
        "Find specific, accurate facts about this topic. "
        "Include: key facts, important figures or components, historical or practical context, "
        "and why it matters. Format: KEY FACTS, CONTEXT, SIGNIFICANCE, SOURCE."
    ),
    connector_hints=(
        "Trace the connections and implications of this topic. "
        "What does it connect to? What are the consequences? "
        "What is the modern relevance?"
    ),
)

# ── REGISTRY ──────────────────────────────────────────────────
SUBJECT_REGISTRY: dict[str, SubjectConfig] = {
    "history": HISTORY,
    "science": SCIENCE,
    "econ":    ECON,
    "law":     LAW,
    "generic": GENERIC,
}

def get_subject(subject_id: str) -> SubjectConfig:
    return SUBJECT_REGISTRY.get(subject_id, GENERIC)