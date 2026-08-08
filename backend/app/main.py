import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.models.schemas import (
    InitAgentRequest, InitAgentResponse, FeedResponse, 
    AgentStatusResponse, EditorialLog, Post
)
from app.agent.memory import db_memory
from app.agent.scheduler import agent_scheduler
from app.agent.persona import PRESET_PERSONAS

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous AI Persona Content Creator API"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    agent_scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    agent_scheduler.stop()

# --- Required Challenge Endpoints ---

@app.post("/api/agent/init", response_model=InitAgentResponse)
async def init_agent(req: InitAgentRequest):
    """
    POST /api/agent/init
    Called once by evaluators/users to initialize the autonomous agent persona.
    """
    name = req.persona.name
    domain = req.persona.domain
    voice_desc = req.persona.voice_description

    # Match preset voice if missing
    if not voice_desc and domain in PRESET_PERSONAS:
        voice_desc = PRESET_PERSONAS[domain]["voice"]

    agent_id = f"agent_{uuid.uuid4().hex[:8]}"
    
    agent_info = db_memory.save_agent(
        agent_id=agent_id,
        name=name,
        domain=domain,
        voice_description=voice_desc or f"Opinionated, technical, concise, authoritative in {domain}."
    )

    # Immediately run 1 cycle so initial feed is populated
    await agent_scheduler.ensure_initial_posts(agent_id)

    return InitAgentResponse(
        agentId=agent_id,
        persona=req.persona,
        createdAt=agent_info["createdAt"],
        status="ACTIVE"
    )

@app.get("/api/agent/feed", response_model=FeedResponse)
async def get_agent_feed(agentId: Optional[str] = Query(None, description="The agentId returned by init")):
    """
    GET /api/agent/feed?agentId=...
    Called repeatedly by evaluators. Returns posts sorted newest first.
    """
    target_agent_id = agentId
    if not target_agent_id:
        latest = db_memory.get_latest_agent()
        if latest:
            target_agent_id = latest["agentId"]
        else:
            # Fallback auto-init default persona if no agent initialized yet
            init_res = await init_agent(InitAgentRequest(
                persona={"name": "Dr. Elena Vance", "domain": "AI Security Researcher"}
            ))
            target_agent_id = init_res.agentId

    posts = db_memory.get_feed(target_agent_id)
    return FeedResponse(posts=posts)

# --- Additional Dashboard & Steer Endpoints ---

@app.get("/api/agent/status", response_model=AgentStatusResponse)
async def get_agent_status(agentId: Optional[str] = Query(None)):
    target_agent_id = agentId
    if not target_agent_id:
        latest = db_memory.get_latest_agent()
        if latest:
            target_agent_id = latest["agentId"]
        else:
            raise HTTPException(status_code=404, detail="No agent initialized yet.")

    agent = db_memory.get_agent(target_agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    feed = db_memory.get_feed(target_agent_id)
    logs = db_memory.get_editorial_logs(target_agent_id, limit=50)
    rejected_count = sum(1 for log in logs if log["decision"] == "REJECTED")

    last_pub = feed[0]["createdAt"] if feed else None
    
    return AgentStatusResponse(
        agentId=target_agent_id,
        persona={
            "name": agent["name"],
            "domain": agent["domain"],
            "voice_description": agent["voice_description"]
        },
        postCount=len(feed),
        rejectedCount=rejected_count,
        lastPublishedAt=last_pub,
        nextPublishAt=None,
        isRunning=agent_scheduler.is_running
    )

@app.get("/api/agent/editorial-logs")
async def get_editorial_logs(agentId: Optional[str] = Query(None), limit: int = 20):
    target_id = agentId
    if not target_id:
        latest = db_memory.get_latest_agent()
        if latest:
            target_id = latest["agentId"]
        else:
            return {"logs": []}
    
    logs = db_memory.get_editorial_logs(target_id, limit=limit)
    return {"logs": logs}

@app.post("/api/agent/trigger-cycle")
async def trigger_cycle(agentId: Optional[str] = Query(None)):
    target_id = agentId
    if not target_id:
        latest = db_memory.get_latest_agent()
        if latest:
            target_id = latest["agentId"]
        else:
            raise HTTPException(status_code=404, detail="No agent initialized.")
            
    post = await agent_scheduler.run_publishing_cycle(target_id)
    if not post:
        return {"status": "NO_POST_PUBLISHED", "message": "Candidates were either rejected or unavailable."}
    return {"status": "SUCCESS", "post": post}

@app.post("/api/agent/simulate-48h")
async def simulate_48h(agentId: Optional[str] = Query(None)):
    """
    Simulates a full 48-hour timeline of autonomous operation by populating 4-6 historical posts
    with ISO 8601 UTC timestamps spaced across the last 48 hours.
    """
    target_id = agentId
    if not target_id:
        latest = db_memory.get_latest_agent()
        if latest:
            target_id = latest["agentId"]
        else:
            init_res = await init_agent(InitAgentRequest(
                persona={"name": "Dr. Elena Vance", "domain": "AI Security Researcher"}
            ))
            target_id = init_res.agentId

    now_utc = datetime.now(timezone.utc)
    time_offsets = [44, 36, 28, 20, 12, 4] # Hours ago
    
    generated_posts = []
    for hours_ago in time_offsets:
        simulated_ts = (now_utc - timedelta(hours=hours_ago)).isoformat()
        post = await agent_scheduler.run_publishing_cycle(target_id, custom_created_at=simulated_ts)
        if post:
            generated_posts.append(post)

    return {"status": "SUCCESS", "postsGenerated": len(generated_posts)}

@app.get("/")
def read_root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "ONLINE",
        "docs": "/docs",
        "endpoints": ["POST /api/agent/init", "GET /api/agent/feed?agentId=..."]
    }
