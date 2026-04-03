"""
Subject Router for the Severus Universal Learning Engine.

Classifies every incoming question BEFORE any agent runs.
Returns: subject_id, question_type, and the matching SubjectConfig.

Fast and cheap — uses a keyword classifier first, falls back to
Claude only if classification is ambiguous.
"""

import re
from subjects.configs import SubjectConfig, get_subject


# ── KEYWORD CLASSIFIERS ───────────────────────────────────────
# Each subject has a set of strong signal keywords.
# Ordered by specificity — more specific checks run first.

SUBJECT_KEYWORDS: dict[str, list[str]] = {
    "law": [
        "law", "legal", "court", "case", "judge", "rights", "act", "statute",
        "constitution", "amendment", "trial", "verdict", "plaintiff", "defendant",
        "liability", "contract", "tort", "precedent", "legislation", "jurisdiction",
        "habeas corpus", "due process", "supreme court", "civil rights act",
        "attorney", "lawyer", "prosecution", "acquittal",
    ],
    "econ": [
        "economy", "economic", "gdp", "inflation", "recession", "monetary",
        "fiscal", "interest rate", "supply", "demand", "market", "trade",
        "capitalism", "socialism", "marxism", "keynes", "keynsian", "fed",
        "central bank", "currency", "debt", "deficit", "tariff", "import",
        "export", "wealth", "income inequality", "stock", "bonds", "investment",
        "microeconomics", "macroeconomics", "price", "profit", "loss",
    ],
    "science": [
        "photosynthesis", "evolution", "dna", "cell", "atom", "molecule",
        "quantum", "relativity", "gravity", "force", "energy", "reaction",
        "element", "compound", "organism", "species", "gene", "chromosome",
        "enzyme", "protein", "biology", "chemistry", "physics", "ecology",
        "ecosystem", "climate", "geology", "astronomy", "planet", "universe",
        "light", "wave", "particle", "thermodynamics", "electromagnetism",
        "neural", "brain", "nervous system", "immune", "vaccine", "virus",
        "bacteria", "mutation", "natural selection", "darwin", "newton",
        "einstein", "hawking", "periodic table", "bohr", "how does",
        "what is a", "scientific", "science",
    ],
    "history": [
        "empire", "war", "revolution", "king", "queen", "pharaoh", "emperor",
        "dynasty", "civilization", "ancient", "medieval", "colonial", "slave",
        "slavery", "independence", "constitution", "battle", "conquest",
        "treaty", "colony", "colonialism", "imperialism", "apartheid",
        "holocaust", "genocide", "renaissance", "reformation", "enlightenment",
        "silk road", "trade route", "bronze age", "iron age", "world war",
        "cold war", "roman", "greek", "egyptian", "aztec", "inca", "ottoman",
        "mongol", "viking", "crusade", "inquisition", "abolition", "emancipation",
        "civil war", "reconstruction", "segregation", "jim crow", "apartheid",
        "decolonisation", "independence movement",
    ],
}

QUESTION_TYPE_KEYWORDS: dict[str, list[str]] = {
    "causal": [
        "why", "what caused", "cause", "reason", "led to", "result of",
        "consequence", "impact", "effect", "how did it happen",
    ],
    "biographical": [
        "who was", "who is", "life of", "biography", "tell me about",
        "person", "leader", "founder", "inventor", "philosopher",
    ],
    "process": [
        "how does", "how do", "how did", "process", "mechanism", "step",
        "work", "function", "explain how", "what happens when",
    ],
    "conceptual": [
        "what is", "what was", "what are", "define", "explain", "describe",
        "overview", "difference between", "compare",
    ],
    "analytical": [
        "analyse", "analyze", "evaluate", "assess", "critically", "argument",
        "debate", "pros and cons", "advantages", "disadvantages",
    ],
}


def classify_question(question: str) -> tuple[str, str]:
    """
    Returns (subject_id, question_type).
    Fast keyword-based classifier — no API call needed.
    """
    q = question.lower()

    # ── Classify subject ──────────────────────────────────────
    subject_scores: dict[str, int] = {s: 0 for s in SUBJECT_KEYWORDS}
    for subject, keywords in SUBJECT_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                # Exact phrase match scores higher
                if f" {kw} " in f" {q} ":
                    subject_scores[subject] += 2
                else:
                    subject_scores[subject] += 1

    # Pick highest scoring subject, default to history
    best_subject = max(subject_scores, key=lambda s: subject_scores[s])
    if subject_scores[best_subject] == 0:
        best_subject = "history"  # default

    # ── Classify question type ─────────────────────────────────
    type_scores: dict[str, int] = {t: 0 for t in QUESTION_TYPE_KEYWORDS}
    for qtype, keywords in QUESTION_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                type_scores[qtype] += 1

    best_type = max(type_scores, key=lambda t: type_scores[t])
    if type_scores[best_type] == 0:
        best_type = "conceptual"  # default

    return best_subject, best_type


def route(question: str) -> tuple[SubjectConfig, str]:
    """
    Main router entry point.
    Returns (SubjectConfig, question_type).
    """
    subject_id, question_type = classify_question(question)
    config = get_subject(subject_id)
    return config, question_type