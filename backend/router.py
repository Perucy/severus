"""
Severus Research Tool — LangGraph Pipeline

Flow:
  Question → Router → Scout → Mapper → Response
  
  (Lens and Assistant are called directly via endpoints, not through the graph)
"""

import operator
from typing import TypedDict, Annotated, Optional

from langgraph.graph import StateGraph, END

from agents.researcher import run_sc"""
Severus Subject Router.

Classifies every question into history, law, or econ.
Hard rejects anything outside those three subjects.
Returns: (SubjectConfig, question_type) or raises SubjectRejected.
"""

from subjects.configs import SubjectConfig, get_subject


class SubjectRejected(Exception):
    """Raised when a question falls outside history, law, and econ."""
    def __init__(self, message: str, suggestion: str = ""):
        self.message = message
        self.suggestion = suggestion
        super().__init__(message)


# ── SUBJECT KEYWORDS ──────────────────────────────────────────

SUBJECT_KEYWORDS: dict[str, list[str]] = {
    "history": [
        "empire", "war", "revolution", "king", "queen", "pharaoh", "emperor",
        "dynasty", "civilization", "ancient", "medieval", "colonial", "slavery",
        "independence", "battle", "conquest", "treaty", "colony", "colonialism",
        "imperialism", "apartheid", "holocaust", "genocide", "renaissance",
        "reformation", "enlightenment", "silk road", "world war", "cold war",
        "roman", "greek", "egyptian", "aztec", "inca", "ottoman", "mongol",
        "viking", "crusade", "abolition", "emancipation", "civil war",
        "segregation", "decolonisation", "independence movement", "coup",
        "dictator", "republic", "monarchy", "feudal", "plague", "famine",
        "migration", "exile", "regime", "resistance", "uprising",
        "historical", "history", "century", "decade", "era", "period",
        "napoleon", "caesar", "hitler", "stalin", "mao", "gandhi", "mandela",
        "lincoln", "churchill", "fall of", "rise of", "decline of",
    ],
    "law": [
        "law", "legal", "court", "case", "judge", "rights", "statute",
        "constitution", "amendment", "trial", "verdict", "plaintiff", "defendant",
        "liability", "contract", "tort", "precedent", "legislation", "jurisdiction",
        "habeas corpus", "due process", "supreme court", "civil rights",
        "attorney", "lawyer", "prosecution", "acquittal", "appeal",
        "regulatory", "regulation", "policy", "international law", "human rights",
        "justice", "crime", "criminal", "punishment", "sanction", "ruling",
        "doctrine", "jurisprudence", "common law", "civil law", "constitutional",
        "bill of rights", "freedom", "liberty", "ordinance", "mandate",
        "injunction", "subpoena", "warrant", "indictment",
    ],
    "econ": [
        "economy", "economic", "gdp", "inflation", "recession", "monetary",
        "fiscal", "interest rate", "supply", "demand", "market", "trade",
        "capitalism", "socialism", "marxism", "keynes", "keynesian", "fed",
        "central bank", "currency", "debt", "deficit", "tariff", "import",
        "export", "wealth", "income inequality", "stock", "bonds", "investment",
        "microeconomics", "macroeconomics", "price", "profit", "loss",
        "unemployment", "growth", "austerity", "stimulus", "bailout",
        "financial crisis", "depression", "boom", "bust", "bubble",
        "globalization", "free trade", "protectionism", "deregulation",
        "privatization", "nationalization", "tax", "subsidy", "welfare",
        "poverty", "inequality", "wages", "labour", "labor", "production",
        "consumption", "savings", "bank", "credit", "mortgage", "hedge fund",
        "derivatives", "commodities", "oil", "gold", "imf", "world bank",
        "wto", "bretton woods", "adam smith", "marx",
    ],
}

OUT_OF_SCOPE_SIGNALS = [
    "photosynthesis", "evolution", "dna", "quantum", "relativity", "gravity",
    "element", "compound", "organism", "species", "gene", "chromosome",
    "enzyme", "protein", "biology", "chemistry", "physics", "ecology",
    "astronomy", "planet", "universe", "thermodynamics", "programming",
    "software", "algorithm", "computer", "machine learning", "neural network",
    "cooking", "recipe", "sport", "football", "basketball", "music", "film",
    "celebrity", "fashion", "medicine", "diagnosis", "symptom", "vitamin",
    "exercise", "diet", "nutrition", "math", "calculus", "geometry", "algebra",
]

QUESTION_TYPE_KEYWORDS: dict[str, list[str]] = {
    "causal": [
        "why", "what caused", "cause", "reason", "led to",
        "result of", "consequence", "impact", "effect",
    ],
    "biographical": [
        "who was", "who is", "life of", "biography",
        "tell me about", "person", "leader", "founder",
    ],
    "process": [
        "how does", "how do", "how did", "process",
        "mechanism", "explain how",
    ],
    "conceptual": [
        "what is", "what was", "what are", "define",
        "explain", "describe", "overview", "compare",
    ],
    "analytical": [
        "analyse", "analyze", "evaluate", "assess",
        "critically", "argument", "debate",
    ],
}

REFRAME_SUGGESTIONS = {
    "science": "Try asking about the history of a scientific discovery, the economics of a scientific industry, or the legal regulation of scientific research.",
    "tech": "Try asking about the economic impact of a technology, the history of a tech company, or the legal frameworks around technology.",
    "default": "Severus covers history, law, and economics. Try rephrasing your question around one of these domains.",
}


def _score_subject(question: str) -> dict[str, int]:
    q = question.lower()
    scores: dict[str, int] = {s: 0 for s in SUBJECT_KEYWORDS}
    for subject, keywords in SUBJECT_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                scores[subject] += 2 if f" {kw} " in f" {q} " else 1
    return scores


def _is_out_of_scope(question: str, subject_scores: dict[str, int]) -> bool:
    q = question.lower()
    top_score = max(subject_scores.values())
    if top_score >= 3:
        return False
    oos_hits = sum(1 for sig in OUT_OF_SCOPE_SIGNALS if sig in q)
    if oos_hits >= 1 and top_score <= 1:
        return True
    if top_score == 0 and len(question.split()) < 6:
        return True
    return False


def _get_suggestion(question: str) -> str:
    q = question.lower()
    science_signals = ["biology", "chemistry", "physics", "quantum", "dna", "evolution"]
    tech_signals = ["programming", "code", "software", "computer", "algorithm"]
    if any(s in q for s in science_signals):
        return REFRAME_SUGGESTIONS["science"]
    if any(s in q for s in tech_signals):
        return REFRAME_SUGGESTIONS["tech"]
    return REFRAME_SUGGESTIONS["default"]


def _classify_question_type(question: str) -> str:
    q = question.lower()
    scores: dict[str, int] = {t: 0 for t in QUESTION_TYPE_KEYWORDS}
    for qtype, keywords in QUESTION_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                scores[qtype] += 1
    best = max(scores, key=lambda t: scores[t])
    return best if scores[best] > 0 else "conceptual"


def route(question: str) -> tuple[SubjectConfig, str]:
    """
    Main router. Returns (SubjectConfig, question_type).
    Raises SubjectRejected if outside history / law / econ.
    """
    subject_scores = _score_subject(question)

    if _is_out_of_scope(question, subject_scores):
        raise SubjectRejected(
            message="Severus covers history, law, and economics only.",
            suggestion=_get_suggestion(question),
        )

    best_subject = max(subject_scores, key=lambda s: subject_scores[s])
    if subject_scores[best_subject] == 0:
        best_subject = "history"

    return get_subject(best_subject), _classify_question_type(question)out
from agents.connector import run_mapper
from router import route
from subjects.configs import SubjectConfig


# ── STATE SCHEMA ──────────────────────────────────────────────

class AgentEvent(TypedDict):
    agent:      str
    type:       str
    content:    str
    tool_name:  Optional[str]
    tool_input: Optional[dict]


class SeverusState(TypedDict):
    # Input
    question:       str
    user_id:        Optional[str]
    past_context:   str

    # Routing
    subject_config: Optional[SubjectConfig]
    question_type:  str
    current_agent:  str
    completed:      bool

    # Agent outputs — clean, no duplicates
    scout_nodes:    list        # from Scout
    mapper_edges:   list        # from Mapper

    # Events stream
    events: Annotated[list[AgentEvent], operator.add]


def create_initial_state(
    question:     str,
    user_id:      Optional[str] = None,
    past_context: str = "",
) -> SeverusState:
    subject_cfg, question_type = route(question)
    return SeverusState(
        question=question,
        user_id=user_id,
        past_context=past_context,
        subject_config=subject_cfg,
        question_type=question_type,
        current_agent="scout",
        completed=False,
        scout_nodes=[],
        mapper_edges=[],
        events=[],
    )


# ── NODES ─────────────────────────────────────────────────────

async def scout_node(state: SeverusState) -> dict:
    return await run_scout(state)


async def mapper_node(state: SeverusState) -> dict:
    return await run_mapper(state)


# ── GRAPH ─────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(SeverusState)

    graph.add_node("scout",  scout_node)
    graph.add_node("mapper", mapper_node)

    graph.set_entry_point("scout")
    graph.add_edge("scout",  "mapper")
    graph.add_edge("mapper", END)

    return graph.compile()


severus_graph = build_graph()