"""
Severus Backend — FastAPI Server
Streams agent events via Server-Sent Events (SSE)
"""

import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

load_dotenv()

app = FastAPI(title="Severus API", version="1.0.0")

# CORS — allow the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://localhost:3000",
        "https://severus-xi.vercel.app",
        "https://severusafrica.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REQUEST MODELS ────────────────────────────────────────────
class ResearchRequest(BaseModel):
    question: str
    narrative_depth: str = "teaser"   # "teaser" | "deep_dive"
    show_reasoning: bool = False


# ── SSE STREAMING ENDPOINT ────────────────────────────────────
@app.post("/research/stream")
async def research_stream(request: ResearchRequest):
    """
    Stream agent events as Server-Sent Events.
    The frontend listens with EventSource and renders events in real time.
    """

    async def event_generator():
        from graph import severus_graph, create_initial_state

        initial_state = create_initial_state(
            question=request.question,
            narrative_depth=request.narrative_depth,
            show_reasoning=request.show_reasoning,
        )

        # Send start event
        yield {
            "event": "start",
            "data": json.dumps({
                "question": request.question,
                "depth": request.narrative_depth,
            }),
        }

        try:
            # Run the graph — stream events as they come
            final_state = None
            async for state_chunk in severus_graph.astream(initial_state):
                # Each chunk is a dict of {node_name: state_updates}
                for node_name, updates in state_chunk.items():
                    # Stream each event from the node
                    for event in updates.get("events", []):
                        yield {
                            "event": "agent_event",
                            "data": json.dumps(event),
                        }
                        await asyncio.sleep(0.05)  # Small delay for UI smoothness

                    # Check for visualizer images
                    if node_name == "visualizer" and updates.get("visualizer_output"):
                        viz = updates["visualizer_output"]
                        for scene in viz.get("scenes", []):
                            if scene.get("type") == "image" and scene.get("result", {}).get("image_b64"):
                                yield {
                                    "event": "image_generated",
                                    "data": json.dumps({
                                        "prompt": scene["result"].get("prompt_used", ""),
                                        "image_b64": scene["result"]["image_b64"],
                                        "mime_type": scene["result"].get("mime_type", "image/png"),
                                    }),
                                }
                            elif scene.get("type") == "video":
                                yield {
                                    "event": "video_prompt",
                                    "data": json.dumps(scene.get("result", {})),
                                }

                    # Update current agent for the UI
                    if updates.get("current_agent"):
                        yield {
                            "event": "agent_change",
                            "data": json.dumps({"agent": updates["current_agent"]}),
                        }

                    final_state = updates

            # Send the final narrative
            if final_state and final_state.get("guide_narrative"):
                yield {
                    "event": "narrative",
                    "data": json.dumps({
                        "narrative": final_state["guide_narrative"],
                        "depth": request.narrative_depth,
                    }),
                }

            # Send completion
            yield {
                "event": "complete",
                "data": json.dumps({"status": "done"}),
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e), "type": type(e).__name__}),
            }

    return EventSourceResponse(event_generator())


# ── SYNC ENDPOINT (for testing) ───────────────────────────────
@app.post("/research")
async def research_sync(request: ResearchRequest):
    """Non-streaming endpoint — returns full result. Good for testing."""
    from graph import severus_graph, create_initial_state

    initial_state = create_initial_state(
        question=request.question,
        narrative_depth=request.narrative_depth,
        show_reasoning=request.show_reasoning,
    )

    try:
        final_state = await severus_graph.ainvoke(initial_state)
        return {
            "question": request.question,
            "historian_output": final_state.get("historian_output"),
            "investigator_output": final_state.get("investigator_output"),
            "visualizer_output": final_state.get("visualizer_output"),
            "guide_narrative": final_state.get("guide_narrative"),
            "events": final_state.get("events", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── HEALTH CHECK ──────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "agents": ["historian", "investigator", "visualizer", "guide"],
        "tools": ["wikipedia", "severus_kb", "slavevoyages", "nano_banana_pro"],
    }


# ── SINGLE AGENT ENDPOINTS (for debugging) ────────────────────
@app.post("/agent/historian")
async def run_historian_only(request: ResearchRequest):
    from graph import create_initial_state
    from agents.historian import run_historian
    state = create_initial_state(request.question)
    result = await run_historian(state)
    return result


@app.post("/agent/investigator")
async def run_investigator_only(request: ResearchRequest):
    from graph import create_initial_state
    from agents.investigator import run_investigator
    state = create_initial_state(request.question)
    state["historian_output"] = "Test historian output for debugging."
    result = await run_investigator(state)
    return result

class ChatRequest(BaseModel):
    message: str
    question: str = ""
    nodes: list = []
    edges: list = []
    chat_history: list = []

@app.post("/chat")
async def chat(request: ChatRequest):
    import anthropic
    
    client = anthropic.Anthropic()
    
    board_summary = f"{len(request.nodes)} nodes: {', '.join(n.get('label','') for n in request.nodes[:8])}"
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system="""You are an AI historian assistant on the Severus PI board. 
        The user has an investigation board with historical nodes and connections.
        Answer their question and suggest board mutations when relevant.
        If adding nodes or edges would help, include them in your response as JSON mutations.
        Format mutations as: [{"type":"add_node","node":{"id":"n_x","label":"X","type":"person|event|place|concept|institution"}},
        {"type":"add_edge","edge":{"from":"n1","to":"n2","label":"connection label"}}]""",
        messages=[
            *[{"role": m["role"], "content": m["content"]} 
              for m in request.chat_history if m.get("role") in ("user","assistant")],
            {"role": "user", "content": f"Board: {board_summary}\n\nQuestion: {request.message}"}
        ],
    )
    
    text = response.content[0].text
    
    # Extract mutations if present
    mutations = []
    import re
    match = re.search(r'\[(\s*\{.*?\}\s*,?\s*)+\]', text, re.DOTALL)
    if match:
        try:
            mutations = json.loads(match.group())
            text = text[:match.start()].strip()
        except Exception:
            pass
    
    return {"text": text, "mutations": mutations}
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)