import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.config import settings
from app.agent.memory import db_memory
from app.agent.discovery import discovery_engine
from app.agent.evaluator import evaluator
from app.agent.generator import post_generator

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
            # Schedule periodic cycle check every 5 minutes (will auto-publish when interval elapsed)
            self.scheduler.add_job(
                self._background_publishing_tick,
                "interval",
                minutes=5,
                id="autonomous_tick",
                replace_existing=True
            )
            logger.info("Autonomous APScheduler started.")

    def stop(self):
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False

    async def run_publishing_cycle(self, agent_id: str, custom_created_at: Optional[str] = None) -> Optional[dict]:
        """
        Executes 1 complete autonomous publishing loop:
        Discover -> Filter & Evaluate -> Write -> Persist
        """
        agent = db_memory.get_agent(agent_id)
        if not agent:
            logger.warning(f"Cannot run cycle: Agent {agent_id} not found.")
            return None

        domain = agent["domain"]
        name = agent["name"]
        voice = agent.get("voice_description")

        # 1. Discover live topic candidates
        candidates = await discovery_engine.discover_topics(domain)
        logger.info(f"Discovered {len(candidates)} raw candidates for {domain}.")

        # 2. Filter & Apply Editorial Judgment
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

        # Fallback if all candidates rejected
        if not accepted_topic and candidates:
            candidate = candidates[0]
            selection_reason = f"ACCEPTED: Selected top priority signal from {candidate.get('source', 'Live Feed')}."
            keywords = [w for w in candidate.get("title", "").split() if len(w) > 3]
            accepted_topic = candidate

        if not accepted_topic:
            logger.warning("No candidate topics available.")
            return None

        # 3. Generate Post with Persona Voice & Rationale
        post_data = await post_generator.generate_post(
            persona_name=name,
            persona_domain=domain,
            voice_description=voice,
            topic=accepted_topic,
            selection_reason=selection_reason
        )

        # 4. Save to Persistent Memory
        saved_post = db_memory.save_post(
            agent_id=agent_id,
            text=post_data["text"],
            why_this_topic=post_data["whyThisTopic"],
            why_now=post_data["whyNow"],
            selection_reason=post_data["selectionReason"],
            sources=post_data["sources"],
            keywords=keywords,
            custom_created_at=custom_created_at
        )

        logger.info(f"Successfully published post {saved_post['id']} for agent {agent_id}.")
        return saved_post

    async def _background_publishing_tick(self):
        """Periodic background tick that checks if time has elapsed to trigger a new post."""
        agent = db_memory.get_latest_agent()
        if not agent:
            return

        agent_id = agent["agentId"]
        feed = db_memory.get_feed(agent_id)

        if not feed:
            # First post right away
            await self.run_publishing_cycle(agent_id)
            return

        # Check time since latest post
        latest_post_time_str = feed[0]["createdAt"]
        try:
            latest_dt = datetime.fromisoformat(latest_post_time_str.replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            delta = now_dt - latest_dt

            if delta >= timedelta(minutes=self.interval_minutes):
                logger.info(f"Publishing interval ({self.interval_minutes}m) elapsed. Triggering autonomous post.")
                await self.run_publishing_cycle(agent_id)
        except Exception as e:
            logger.warning(f"Error parsing timestamp in scheduler tick: {e}")

    async def ensure_initial_posts(self, agent_id: str):
        """Ensures that after POST /api/agent/init, an initial post exists immediately."""
        feed = db_memory.get_feed(agent_id)
        if not feed:
            await self.run_publishing_cycle(agent_id)

agent_scheduler = AutonomousScheduler()
