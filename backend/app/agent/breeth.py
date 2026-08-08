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
            "Content-Type": "application/json"
        }

    async def log_episode_write(self, topic_title: str, post_text: str, persona_name: str) -> bool:
        """
        Sends a POST request to /v1/episodes to store memory episode in Breeth Cloud.
        Increments WRITES and KNOTS counter on Breeth Dashboard.
        """
        if not self.api_key:
            return False
            
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                payload = {
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Persona '{persona_name}' researched and selected topic: '{topic_title}'"
                        },
                        {
                            "role": "assistant",
                            "content": post_text
                        }
                    ]
                }
                res = await client.post(f"{self.base_url}/v1/episodes", json=payload, headers=self.headers)
                if res.status_code in (200, 201):
                    logger.info(f"[Breeth Cloud] Successfully recorded episode write to Breeth memory graph! Status: {res.status_code}")
                    return True
                else:
                    logger.warning(f"[Breeth Cloud] Episode write status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"[Breeth Cloud] Episode write error: {e}")
        return False

    async def search_memory_retrieval(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Sends a POST request to /v1/search to query Breeth Knowledge Graph for relevant memories.
        Increments RETRIEVALS and INTENTS counter on Breeth Dashboard.
        """
        if not self.api_key:
            return {}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                payload = {
                    "query": query,
                    "limit": limit
                }
                res = await client.post(f"{self.base_url}/v1/search", json=payload, headers=self.headers)
                if res.status_code in (200, 201):
                    logger.info(f"[Breeth Cloud] Successfully queried Breeth memory graph for '{query[:30]}...'")
                    return res.json()
                else:
                    logger.warning(f"[Breeth Cloud] Memory search status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"[Breeth Cloud] Memory search error: {e}")
        return {}

breeth_client = BreethClient()
