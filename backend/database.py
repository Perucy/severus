"""
Supabase client for Severus.
Handles session saving, learner profile updates, and prior knowledge retrieval.
"""

import os
from typing import Optional
from supabase import create_client, Client
from core.config import settings

def get_client() -> Optional[Client]:
    """Return Supabase client or None if env vars not set."""
    url  = settings.SUPABASE_URL
    key  = settings.SUPABASE_SERVICE_KEY  # service key for server-side
    if not url or not key:
        return None
    return create_client(url, key)


# ── SESSION ───────────────────────────────────────────────────
async def save_session(
    user_id:              Optional[str],
    question:             str,
    subject_id:           str,
    question_type:        str,
    depth:                str,
    researcher_output:     str,
    investigator_output:  str,
    guide_narrative:      str,
    pi_board:             dict,
    has_image:            bool,
    duration_ms:          int,
    concepts:             list[dict],   # [{"slug": ..., "label": ...}]
) -> Optional[str]:
    """
    Save a research session and update learner concepts.
    Returns session_id or None if Supabase unavailable.
    """
    sb = get_client()
    if not sb or not user_id:
        return None

    try:
        # Insert session
        result = sb.table("sessions").insert({
            "user_id":             user_id,
            "question":            question,
            "subject_id":          subject_id,
            "question_type":       question_type,
            "depth":               depth,
            "researcher_output":    researcher_output,
            "investigator_output": investigator_output,
            "guide_narrative":     guide_narrative,
            "pi_board":            pi_board,
            "has_image":           has_image,
            "duration_ms":         duration_ms,
        }).execute()

        session_id = result.data[0]["id"] if result.data else None

        # Insert session concepts
        if session_id and concepts:
            sb.table("session_concepts").insert([
                {"session_id": session_id, "concept_slug": c["slug"], "concept_label": c["label"]}
                for c in concepts
            ]).execute()

        # Upsert learner concepts (update confidence)
        for concept in concepts:
            sb.rpc("upsert_learner_concept", {
                "p_user_id":    user_id,
                "p_slug":       concept["slug"],
                "p_label":      concept["label"],
                "p_subject_id": subject_id,
            }).execute()

        return session_id

    except Exception as e:
        print(f"[supabase] save_session error: {e}")
        return None


# ── PRIOR KNOWLEDGE ───────────────────────────────────────────
async def get_prior_knowledge(
    user_id:     str,
    question:    str,
    subject_id:  str,
    limit:       int = 8,
) -> str:
    """
    Returns a formatted string of prior knowledge relevant to this question.
    Used to inject into agent prompts.
    """
    sb = get_client()
    if not sb or not user_id:
        return ""

    try:
        # Extract keywords from question (words > 3 chars)
        keywords = [w for w in question.lower().split() if len(w) > 3][:5]

        result = sb.rpc("get_relevant_prior_knowledge", {
            "p_user_id":  user_id,
            "p_keywords": keywords,
        }).execute()

        if not result.data:
            return ""

        lines = []
        for row in result.data[:8]:
            confidence = row["confidence"]
            label      = row["concept_label"]
            conf_str   = "well" if confidence > 0.7 else "somewhat" if confidence > 0.4 else "briefly"
            lines.append(f"- {label} (encountered {conf_str})")

        return "\n".join(lines) if lines else ""

    except Exception as e:
        print(f"[supabase] get_prior_knowledge error: {e}")
        return ""


# ── RECENT SESSIONS ───────────────────────────────────────────
async def get_recent_sessions(
    user_id:    str,
    subject_id: Optional[str] = None,
    limit:      int = 5,
) -> list[dict]:
    """Returns recent session summaries for context injection."""
    sb = get_client()
    if not sb or not user_id:
        return []

    try:
        query = sb.table("sessions")\
            .select("question, subject_id, created_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)

        if subject_id:
            query = query.eq("subject_id", subject_id)

        result = query.execute()
        return result.data or []

    except Exception as e:
        print(f"[supabase] get_recent_sessions error: {e}")
        return []