"""
Severus Agent Graph — LangGraph StateGraph
Orchestrates 4 agents in a pipeline:
Guide (router) → Historian → Investigator → Visualizer → Guide (synthesizer)
"""

import json
from typing import TypedDict, Optional, Annotated
from langgraph.graph import StateGraph, END
import operator


# ── STATE ─────────────────────────────────────────────────────
class AgentEvent(TypedDict):
    agent: str
    type: str          # "thinking" | "tool_call" | "tool_result" | "output"
    content: str
    tool_name: Optional[str]
    tool_input: Optional[dict]
    timestamp: Optional[str]


class SeverusState(TypedDict):
    question: str
    narrative_depth: str                           # "teaser" | "deep_dive"
    show_reasoning: bool

    # Agent outputs
    historian_output: Optional[str]
    investigator_output: Optional[str]
    visualizer_output: Optional[dict]              # includes image data
    guide_narrative: Optional[str]

    # UI streaming events
    events: Annotated[list[AgentEvent], operator.add]

    # Routing
    skip_visualizer: bool
    current_agent: str
    completed: bool


def create_initial_state(question: str, narrative_depth: str = "teaser",
                          show_reasoning: bool = False) -> SeverusState:
    return SeverusState(
        question=question,
        narrative_depth=narrative_depth,
        show_reasoning=show_reasoning,
        historian_output=None,
        investigator_output=None,
        visualizer_output=None,
        guide_narrative=None,
        events=[],
        skip_visualizer=False,
        current_agent="historian",
        completed=False,
    )


# ── AGENT NODES ───────────────────────────────────────────────
from agents.historian   import run_historian
from agents.investigator import run_investigator
from agents.visualizer  import run_visualizer
from agents.guide       import run_guide


async def historian_node(state: SeverusState) -> dict:
    return await run_historian(state)


async def investigator_node(state: SeverusState) -> dict:
    return await run_investigator(state)


async def visualizer_node(state: SeverusState) -> dict:
    return await run_visualizer(state)


async def guide_node(state: SeverusState) -> dict:
    return await run_guide(state)


def should_visualize(state: SeverusState) -> str:
    """Decide whether to run the Visualizer based on question type."""
    question_lower = state["question"].lower()
    visual_keywords = ["show", "image", "picture", "visualize", "look like",
                       "what did", "illustrate", "draw", "painting", "scene",
                       "pyramid", "palace", "city", "temple", "ship", "battle"]
    if state.get("skip_visualizer") or not any(kw in question_lower for kw in visual_keywords):
        # Still run visualizer but flag it as optional
        pass
    return "visualizer"


# ── BUILD GRAPH ───────────────────────────────────────────────
def build_graph() -> StateGraph:
    graph = StateGraph(SeverusState)

    graph.add_node("historian",   historian_node)
    graph.add_node("investigator", investigator_node)
    graph.add_node("visualizer",  visualizer_node)
    graph.add_node("guide",       guide_node)

    # Linear pipeline: Historian → Investigator → Visualizer → Guide → END
    graph.set_entry_point("historian")
    graph.add_edge("historian",    "investigator")
    graph.add_edge("investigator", "visualizer")
    graph.add_edge("visualizer",   "guide")
    graph.add_edge("guide",        END)

    return graph.compile()


# Compiled graph singleton
severus_graph = build_graph()