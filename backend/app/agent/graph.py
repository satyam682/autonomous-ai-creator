import logging
from typing import List, Dict, Any, Optional, TypedDict
from langgraph.graph import StateGraph, END
from app.agent.discovery import discovery_engine
from app.agent.evaluator import evaluator
from app.agent.generator import post_generator
from app.agent.memory import db_memory

logger = logging.getLogger("agent_graph")

class AgentState(TypedDict):
    agent_id: str
    persona_name: str
    persona_domain: str
    voice_description: Optional[str]
    discovered_candidates: List[Dict[str, Any]]
    accepted_topic: Optional[Dict[str, Any]]
    selection_reason: Optional[str]
    keywords: List[str]
    generated_post: Optional[Dict[str, Any]]
    saved_post: Optional[Dict[str, Any]]
    custom_created_at: Optional[str]
    status: str

# --- Graph Node Functions ---

async def discover_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Multi-source Live Topic Discovery."""
    domain = state["persona_domain"]
    logger.info(f"[LangGraph Node: Discover] Discovering live topics for domain: {domain}")
    candidates = await discovery_engine.discover_topics(domain)
    return {"discovered_candidates": candidates, "status": "DISCOVERED"}

async def judge_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Editorial Judgment & Curation Filter."""
    agent_id = state["agent_id"]
    name = state["persona_name"]
    domain = state["persona_domain"]
    candidates = state.get("discovered_candidates", [])
    
    logger.info(f"[LangGraph Node: Judge] Evaluating {len(candidates)} candidate topics...")
    
    accepted_topic = None
    selection_reason = ""
    keywords = []

    for candidate in candidates:
        is_accepted, score, reason, candidate_keywords = await evaluator.evaluate_candidate(
            agent_id=agent_id,
            persona_name=name,
            persona_domain=domain,
            candidate=candidate
        )
        if is_accepted:
            accepted_topic = candidate
            selection_reason = reason
            keywords = candidate_keywords
            break

    if not accepted_topic and candidates:
        candidate = candidates[0]
        selection_reason = f"ACCEPTED: Top signal from {candidate.get('source', 'Live Feed')}."
        keywords = [w for w in candidate.get("title", "").split() if len(w) > 3]
        accepted_topic = candidate

    return {
        "accepted_topic": accepted_topic,
        "selection_reason": selection_reason,
        "keywords": keywords,
        "status": "JUDGED" if accepted_topic else "REJECTED_ALL"
    }

async def generate_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Persona Content & Rationale Generator."""
    accepted_topic = state.get("accepted_topic")
    if not accepted_topic:
        return {"status": "SKIPPED_GENERATION"}

    logger.info(f"[LangGraph Node: Generate] Generating post for topic: {accepted_topic.get('title', '')[:40]}")
    
    post_data = await post_generator.generate_post(
        persona_name=state["persona_name"],
        persona_domain=state["persona_domain"],
        voice_description=state.get("voice_description"),
        topic=accepted_topic,
        selection_reason=state.get("selection_reason", "")
    )
    
    return {"generated_post": post_data, "status": "GENERATED"}

async def store_node(state: AgentState) -> Dict[str, Any]:
    """Node 4: Persistent Memory Write & Deduplication Indexing."""
    post_data = state.get("generated_post")
    if not post_data:
        return {"status": "NO_POST_TO_STORE"}

    logger.info(f"[LangGraph Node: Store] Saving post to SQLite memory store...")
    
    saved_post = db_memory.save_post(
        agent_id=state["agent_id"],
        text=post_data["text"],
        why_this_topic=post_data["whyThisTopic"],
        why_now=post_data["whyNow"],
        selection_reason=post_data["selectionReason"],
        sources=post_data["sources"],
        keywords=state.get("keywords", []),
        custom_created_at=state.get("custom_created_at")
    )
    
    return {"saved_post": saved_post, "status": "STORED_AND_COMPLETED"}

# --- Graph Routing Logic ---

def should_generate(state: AgentState) -> str:
    if state.get("accepted_topic"):
        return "generate"
    return END

# --- LangGraph Graph Construction ---

def build_agent_graph():
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("discover", discover_node)
    workflow.add_node("judge", judge_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("store", store_node)

    # Define Edges
    workflow.set_entry_point("discover")
    workflow.add_edge("discover", "judge")
    
    workflow.add_conditional_edges(
        "judge",
        should_generate,
        {
            "generate": "generate",
            END: END
        }
    )
    
    workflow.add_edge("generate", "store")
    workflow.add_edge("store", END)

    return workflow.compile()

autonomous_agent_graph = build_agent_graph()
