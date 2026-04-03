"""
Severus Universal Learning Engine — FastAPI Server
"""

import os
import json
import time
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from graph import severus_graph, create_initial_state
from database import save_session, get_prior_knowledge, get_client

load_dotenv()

app = FastAPI(title="Severus Universal Learning Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:3000",
        "https://severus-xi.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REQUEST MODEL ─────────────────────────────────────────────
class ResearchRequest(BaseModel):
    question:        str
    narrative_depth: str  = "teaser"    # "teaser" | "deep_dive"
    show_reasoning:  bool = False
    user_id:         Optional[str] = None   # Supabase user UUID
    past_context:    str  = ""              # localStorage fallback
    prior_knowledge: str  = ""              # from Supabase learner profile


# ── MAIN RESEARCH ENDPOINT ────────────────────────────────────
@app.post("/research")
async def research(request: ResearchRequest):
    """
    Full four-agent pipeline. Returns complete JSON response.
    Frontend polls this — no SSE complexity.
    """

    start_ms = int(time.time() * 1000)

    # Fetch prior knowledge from Supabase if user_id provided
    prior_knowledge = request.prior_knowledge
    if request.user_id and not prior_knowledge:
        prior_knowledge = await get_prior_knowledge(
            user_id=request.user_id,
            question=request.question,
            subject_id="",
        )

    initial_state = create_initial_state(
        question=request.question,
        narrative_depth=request.narrative_depth,
        show_reasoning=request.show_reasoning,
        user_id=request.user_id,
        past_context=request.past_context,
        prior_knowledge=prior_knowledge,
    )

    try:
        final_state = await severus_graph.ainvoke(initial_state)

        duration_ms = int(time.time() * 1000) - start_ms

        # Extract subject info
        subject_cfg  = final_state.get("subject_config")
        subject_id   = subject_cfg.id if subject_cfg else "history"
        question_type = final_state.get("question_type", "conceptual")

        # Extract concepts from researcher JSON for Supabase
        researcher_json = final_state.get("researcher_json") or {}
        entities = researcher_json.get("entities", [])
        concepts = [
            {"slug": e.lower().replace(" ", "-")[:40], "label": e}
            for e in entities[:10]
        ]

        # Extract pi_board from connector output
        connector_out = final_state.get("connector_output") or ""
        pi_board = {}
        if "```pi_board" in connector_out:
            try:
                raw = connector_out.split("```pi_board")[1].split("```")[0].strip()
                pi_board = json.loads(raw)
            except Exception:
                pass

        # Check for images
        viz = final_state.get("visualizer_output") or {}
        has_image = any(
            s.get("type") in ("generate_image", "image") and s.get("result", {}).get("image_b64")
            for s in viz.get("scenes", [])
        )

        # Save to Supabase (non-blocking — don't fail if Supabase is down)
        if request.user_id:
            try:
                await save_session(
                    user_id=request.user_id,
                    question=request.question,
                    subject_id=subject_id,
                    question_type=question_type,
                    depth=request.narrative_depth,
                    historian_output=final_state.get("researcher_output") or "",
                    investigator_output=final_state.get("connector_output") or "",
                    guide_narrative=final_state.get("guide_narrative") or "",
                    pi_board=pi_board,
                    has_image=has_image,
                    duration_ms=duration_ms,
                    concepts=concepts,
                )
            except Exception as db_err:
                print(f"[supabase] save failed (non-fatal): {db_err}")

        return {
            "question":             request.question,
            "subject":              subject_id,
            "question_type":        question_type,
            "prior_knowledge_used": bool(prior_knowledge),

            # Agent outputs (new names)
            "researcher_output":   final_state.get("researcher_output"),
            "connector_output":    final_state.get("connector_output"),
            "visualizer_output":   final_state.get("visualizer_output"),
            "guide_narrative":     final_state.get("guide_narrative"),

            # Backward-compat aliases for frontend
            "historian_output":    final_state.get("researcher_output"),
            "investigator_output": final_state.get("connector_output"),

            "events":              final_state.get("events", []),
            "duration_ms":         duration_ms,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── PRIOR KNOWLEDGE ENDPOINT ──────────────────────────────────
@app.get("/user/{user_id}/prior-knowledge")
async def user_prior_knowledge(user_id: str, subject: Optional[str] = None):
    """Return a user's top concepts by confidence."""
   
    sb = get_client()
    if not sb:
        return {"concepts": []}
    try:
        result = sb.rpc("get_prior_knowledge", {
            "p_user_id":    user_id,
            "p_subject_id": subject,
            "p_limit":      20,
        }).execute()
        return {"concepts": result.data or []}
    except Exception as e:
        return {"concepts": [], "error": str(e)}


# ── HEALTH CHECK ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":  "ok",
        "version": "2.0.0",
        "agents":  ["researcher", "connector", "visualizer", "teacher"],
        "tools":   ["tavily_web_search", "wikipedia", "severus_kb", "slavevoyages", "imagen_4"],
        "subjects": ["history", "science", "econ", "law"],
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)