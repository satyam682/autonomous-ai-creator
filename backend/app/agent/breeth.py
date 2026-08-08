import httpx
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("breeth_client")

class BreethClient:
    def __init__(self):
        self.api_key = settings.BREETH_API_KEY
        self.base_url = settings.BREETH_API_URL.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    async def log_write(self, agent_id: str, text: str, metadata: Dict[str, Any]) -> bool:
        """
        Logs a WRITE event to Breeth Memory Cloud when a post is published.
        Increments the WRITES counter on Breeth Dashboard.
        """
        if not self.api_key:
            return False
            
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {
                    "agent_id": agent_id,
                    "type": "WRITE",
                    "content": text,
                    "metadata": metadata
                }
                # Try primary writes endpoint
                res = await client.post(f"{self.base_url}/v1/writes", json=payload, headers=self.headers)
                if res.status_code in (200, 201):
                    logger.info(f"[Breeth Cloud] Successfully logged WRITE for agent {agent_id}.")
                    return True
                else:
                    # Alternative fallback endpoint
                    res2 = await client.post(f"{self.base_url}/api/memory/writes", json=payload, headers=self.headers)
                    if res2.status_code in (200, 201):
                        logger.info(f"[Breeth Cloud] Logged WRITE via fallback endpoint.")
                        return True
        except Exception as e:
            logger.warning(f"[Breeth Cloud] Write logging notice: {e}")
        return False

    async def log_intent(self, agent_id: str, intent_name: str, domain: str) -> bool:
        """
        Logs an INTENT event to Breeth Cloud (e.g. 'Discover & Curate AI Security Topics').
        Increments INTENTS counter on Breeth Dashboard.
        """
        if not self.api_key:
            return False

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {
                    "agent_id": agent_id,
                    "type": "INTENT",
                    "intent": intent_name,
                    "domain": domain
                }
                res = await client.post(f"{self.base_url}/v1/intents", json=payload, headers=self.headers)
                return res.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[Breeth Cloud] Intent logging notice: {e}")
        return False

    async def log_retrieval(self, agent_id: str, query: str) -> bool:
        """
        Logs a RETRIEVAL event to Breeth Cloud when deduplication memory is queried.
        Increments RETRIEVALS counter on Breeth Dashboard.
        """
        if not self.api_key:
            return False

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {
                    "agent_id": agent_id,
                    "type": "RETRIEVAL",
                    "query": query
                }
                res = await client.post(f"{self.base_url}/v1/retrievals", json=payload, headers=self.headers)
                return res.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[Breeth Cloud] Retrieval logging notice: {e}")
        return False

    async def log_knot(self, agent_id: str, knot_title: str, tags: List[str]) -> bool:
        """
        Logs a KNOT event to Breeth Cloud linking topics in the Knowledge Graph.
        Increments KNOTS counter on Breeth Dashboard.
        """
        if not self.api_key:
            return False

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                payload = {
                    "agent_id": agent_id,
                    "type": "KNOT",
                    "title": knot_title,
                    "tags": tags
                }
                res = await client.post(f"{self.base_url}/v1/knots", json=payload, headers=self.headers)
                return res.status_code in (200, 201)
        except Exception as e:
            logger.warning(f"[Breeth Cloud] Knot logging notice: {e}")
        return False

breeth_client = BreethClient()
