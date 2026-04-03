"""
Severus Universal Learning Engine — LangGraph Pipeline

Flow:
  Question → Subject Router → Researcher
                                  ↓
                    Connector ──────── Visualizer   (parallel)
                          ↓                ↓
                          └───── Narrator ─┘
                                    ↓
                                Response
"""

import asyncio
import operator
from typing import TypedDict, Annotated, Optional

from langgraph.graph import StateGraph, END

from agents.researcher  import run_researcher
from agents.connector   import run_connector
from agents.visualizer  import run_visualizer
from agents.teacher import run_teacher
from router             import route
from subjects.configs   import SubjectConfig


# ── STATE SCHEMA ──────────────────────────────────────────────
class AgentEvent(TypedDict):
    agent:      str
    type:       str
    content:    str
    tool_name:  Optional[str]
    tool_input: Optional[dict]


class SeverusState(TypedDict):
    # Input
    question:        str
    narrative_depth: str
    show_reasoning:  bool
    user_id:         Optional[str]
    past_context:    str
    prior_knowledge: str

    # Routing
    subject_config:  Optional[SubjectConfig]
    question_type:   str
    current_agent:   str
    completed:       bool

    # Agent outputs
    researcher_output:  Optional[str]
    researcher_json:    Optional[dict]
    connector_output:   Optional[str]
    visualizer_output:  Optional[dict]
    guide_narrative:    Optional[str]

    # Backward-compat aliases (ResearchSection.jsx reads these)
    historian_output:   Optional[str]
    investigator_output: Optional[str]

    # Events stream
    events: Annotated[list[AgentEvent], operator.add]


def create_initial_state(
    question:        str,
    narrative_depth: str = "teaser",
    show_reasoning:  bool = False,
    user_id:         Optional[str] = None,
    past_context:    str = "",
    prior_knowledge: str = "",
) -> SeverusState:
    subject_cfg, question_type = route(question)
    return SeverusState(
        question=question,
        narrative_depth=narrative_depth,
        show_reasoning=show_reasoning,
        user_id=user_id,
        past_context=past_context,
        prior_knowledge=prior_knowledge,
        subject_config=subject_cfg,
        question_type=question_type,
        current_agent="researcher",
        completed=False,
        researcher_output=None,
        researcher_json=None,
        connector_output=None,
        visualizer_output=None,
        guide_narrative=None,
        historian_output=None,       # compat alias
        investigator_output=None,    # compat alias
        events=[],
    )


# ── NODES ─────────────────────────────────────────────────────

async def researcher_node(state: SeverusState) -> dict:
    result = await run_researcher(state)
    return {
        **result,
        # Keep backward-compat aliases
        "historian_output": result.get("researcher_output"),
    }


async def parallel_node(state: SeverusState) -> dict:
    """Run Connector and Visualizer in parallel — saves 15-25 seconds."""
    connector_task  = asyncio.create_task(run_connector(state))
    visualizer_task = asyncio.create_task(run_visualizer(state))

    connector_result, visualizer_result = await asyncio.gather(
        connector_task, visualizer_task
    )

    # Merge events from both
    all_events = (
        connector_result.get("events", []) +
        visualizer_result.get("events", [])
    )

    return {
        "connector_output":   connector_result.get("connector_output"),
        "visualizer_output":  visualizer_result.get("visualizer_output"),
        # Backward-compat
        "investigator_output": connector_result.get("connector_output"),
        "events":             all_events,
        "current_agent":      "teacher",
    }


async def teacher_node(state: SeverusState) -> dict:
    result = await run_teacher(state)
    return result


# ── GRAPH ─────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(SeverusState)

    graph.add_node("researcher", researcher_node)
    graph.add_node("parallel",   parallel_node)
    graph.add_node("teacher",   teacher_node)

    graph.set_entry_point("researcher")
    graph.add_edge("researcher", "parallel")
    graph.add_edge("parallel",   "teacher")
    graph.add_edge("teacher",   END)

    return graph.compile()


severus_graph = build_graph()