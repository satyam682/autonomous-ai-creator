from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PersonaSpec(BaseModel):
    name: str = Field(..., example="Dr. Elena Vance")
    domain: str = Field(..., example="AI Security & LLM Alignment Researcher")
    voice_description: Optional[str] = Field(
        None, 
        example="Analytical, skeptical of hype, evidence-first, witty, security-minded"
    )

class InitAgentRequest(BaseModel):
    persona: PersonaSpec

class InitAgentResponse(BaseModel):
    agentId: str
    persona: PersonaSpec
    createdAt: str
    status: str

class Rationale(BaseModel):
    whyThisTopic: str
    whyNow: str
    selectionReason: str

class Post(BaseModel):
    id: str
    createdAt: str  # ISO 8601 UTC timestamp e.g. "2026-08-08T09:30:00Z"
    text: str
    rationale: Rationale
    sources: List[str]

class FeedResponse(BaseModel):
    posts: List[Post]

class EditorialLog(BaseModel):
    id: str
    timestamp: str
    topicTitle: str
    score: float
    decision: str  # "ACCEPTED" | "REJECTED"
    rejectionReason: Optional[str] = None
    sources: List[str] = []

class AgentStatusResponse(BaseModel):
    agentId: str
    persona: PersonaSpec
    postCount: int
    rejectedCount: int
    lastPublishedAt: Optional[str] = None
    nextPublishAt: Optional[str] = None
    isRunning: bool = True
