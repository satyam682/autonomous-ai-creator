import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.config import settings
from app.agent.memory import db_memory
from app.agent.graph import autonomous_agent_graph

logger = logging.getLogger("scheduler")

class AutonomousScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.interval_minutes = settings.DEFAULT_INTERVAL_MINUTES
        self.is_running = False

    def start(self):
        if not self.is_running:
            self.scheduler.start()
            self.is_running = True
            # Schedule periodic cycle check every 5 minutes
            self.scheduler.add_job(
                self._background_publishing_tick,
                "interval",
                minutes=5,
                id="autonomous_tick",
                replace_existing=True
            )
            logger.info("Autonomous APScheduler started with LangGraph engine.")

    def stop(self):
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False

    async def run_publishing_cycle(self, agent_id: str, custom_created_at: Optional[str] = None) -> Optional[dict]:
        """
        Executes 1 complete autonomous publishing loop via LangGraph StateMachine:
        Discover Node -> Judge Node -> Generate Node -> Store Node
        """
        agent = db_memory.get_agent(agent_id)
        if not agent:
            logger.warning(f"Cannot run cycle: Agent {agent_id} not found.")
            return None

        initial_state = {
            "agent_id": agent_id,
            "persona_name": agent["name"],
            "persona_domain": agent["domain"],
            "voice_description": agent.get("voice_description"),
            "discovered_candidates": [],
            "accepted_topic": None,
            "selection_reason": None,
            "keywords": [],
            "generated_post": None,
            "saved_post": None,
            "custom_created_at": custom_created_at,
            "status": "INITIALIZED"
        }

        # Invoke LangGraph State Graph
        final_state = await autonomous_agent_graph.ainvoke(initial_state)
        
        saved_post = final_state.get("saved_post")
        if saved_post:
            logger.info(f"LangGraph Cycle completed! Published post {saved_post['id']} for agent {agent_id}.")
        else:
            logger.warning("LangGraph Cycle completed without generating a new post.")
            
        return saved_post

    async def _background_publishing_tick(self):
        """Periodic background tick that checks if time has elapsed to trigger a new post."""
        agent = db_memory.get_latest_agent()
        if not agent:
            return

        agent_id = agent["agentId"]
        feed = db_memory.get_feed(agent_id)

        if not feed:
            await self.run_publishing_cycle(agent_id)
            return

        latest_post_time_str = feed[0]["createdAt"]
        try:
            latest_dt = datetime.fromisoformat(latest_post_time_str.replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            delta = now_dt - latest_dt

            if delta >= timedelta(minutes=self.interval_minutes):
                logger.info(f"Publishing interval ({self.interval_minutes}m) elapsed. Triggering autonomous LangGraph cycle.")
                await self.run_publishing_cycle(agent_id)
        except Exception as e:
            logger.warning(f"Error parsing timestamp in scheduler tick: {e}")

    async def ensure_initial_posts(self, agent_id: str):
        """Ensures that after POST /api/agent/init, an initial post exists immediately."""
        feed = db_memory.get_feed(agent_id)
        if not feed:
            await self.run_publishing_cycle(agent_id)

agent_scheduler = AutonomousScheduler()
