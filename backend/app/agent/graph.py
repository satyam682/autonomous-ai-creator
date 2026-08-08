import logging
import random
from typing import List, Dict, Any, Optional, TypedDict
from langgraph.graph import StateGraph, END
from app.agent.discovery import discovery_engine
from app.agent.evaluator import evaluator
from app.agent.generator import post_generator
from app.agent.memory import db_memory
from app.agent.breeth import breeth_client

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
    agent_id = state["agent_id"]
    domain = state["persona_domain"]
    logger.info(f"[LangGraph Node: Discover] Discovering live topics for domain: {domain}")
    
    # Log INTENT event to Breeth Cloud
    await breeth_client.log_intent(agent_id, f"Discover & Curate {domain} Topics", domain)

    candidates = await discovery_engine.discover_topics(domain)
    random.shuffle(candidates)
    return {"discovered_candidates": candidates, "status": "DISCOVERED"}

async def judge_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Editorial Judgment & Curation Filter with Strict Deduplication."""
    agent_id = state["agent_id"]
    name = state["persona_name"]
    domain = state["persona_domain"]
    candidates = state.get("discovered_candidates", [])
    
    logger.info(f"[LangGraph Node: Judge] Evaluating {len(candidates)} candidate topics for {domain}...")
    
    # Log RETRIEVAL event to Breeth Cloud
    await breeth_client.log_retrieval(agent_id, f"Query deduplication memory for {domain}")

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

    # If all candidates rejected, pick from guaranteed unique fallback pool
    if not accepted_topic:
        fallbacks = discovery_engine.get_fallback_topics(domain)
        for fb in fallbacks:
            fb_title = fb.get("title", "")
            fb_kw = [w.strip() for w in fb_title.split() if len(w.strip()) > 3]
            if not db_memory.is_duplicate_topic(agent_id, fb_title, fb_kw):
                accepted_topic = fb
                selection_reason = f"ACCEPTED: Curated research signal from {fb.get('source', 'Live Feed')}."
                keywords = fb_kw
                break

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

    logger.info(f"[LangGraph Node: Generate] Generating post for topic: {accepted_topic.get('title', '')[:50]}")
    
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
    agent_id = state["agent_id"]
    post_data = state.get("generated_post")
    if not post_data:
        return {"status": "NO_POST_TO_STORE"}

    logger.info(f"[LangGraph Node: Store] Saving unique post to SQLite memory store...")
    
    saved_post = db_memory.save_post(
        agent_id=agent_id,
        text=post_data["text"],
        why_this_topic=post_data["whyThisTopic"],
        why_now=post_data["whyNow"],
        selection_reason=post_data["selectionReason"],
        sources=post_data["sources"],
        keywords=state.get("keywords", []),
        custom_created_at=state.get("custom_created_at")
    )

    # Sync WRITE and KNOT events to Breeth Cloud Dashboard!
    await breeth_client.log_write(
        agent_id=agent_id,
        text=saved_post["text"],
        metadata={
            "post_id": saved_post["id"],
            "rationale": saved_post["rationale"],
            "sources": saved_post["sources"]
        }
    )
    await breeth_client.log_knot(
        agent_id=agent_id,
        knot_title=saved_post["text"][:50],
        tags=state.get("keywords", [])
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

    workflow.add_node("discover", discover_node)
    workflow.add_node("judge", judge_node)
    workflow.add_node("generate", generate_node)
    workflow.add_node("store", store_node)

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
