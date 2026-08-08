import json
import httpx
import logging
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from app.config import settings
from app.agent.persona import PersonaManager

logger = logging.getLogger("generator")

class PostGenerator:
    def __init__(self):
        self.cohere_api_key = settings.COHERE_API_KEY
        self.cohere_model = settings.COHERE_MODEL
        self.openai_api_key = settings.OPENAI_API_KEY
        self.openai_model = settings.LLM_MODEL
        
        if self.openai_api_key:
            self.llm = ChatOpenAI(openai_api_key=self.openai_api_key, model=self.openai_model, temperature=0.7)
        else:
            self.llm = None

    async def _generate_with_cohere(
        self, 
        system_prompt: str, 
        title: str, 
        snippet: str, 
        source_name: str, 
        source_url: str, 
        selection_reason: str
    ) -> Optional[Dict[str, Any]]:
        """Generates post content using Cohere AI API (model: command-a-03-2025)."""
        if not self.cohere_api_key:
            return None

        try:
            user_prompt = f"""
Write a new autonomous post based on this accepted topic:

Topic Title: {title}
Topic Context: {snippet}
Primary Source: {source_name} ({source_url})
Editorial Selection Reason: {selection_reason}

Respond ONLY in valid JSON matching this exact structure:
{{
  "text": "The full post text written strictly in your persona voice (2-3 paragraphs, punchy, opinionated, deep technical insight).",
  "whyThisTopic": "1-2 sentences explaining why this topic matters to your domain.",
  "whyNow": "1-2 sentences explaining why this is timely right now.",
  "selectionReason": "{selection_reason}"
}}
"""
            headers = {
                "Authorization": f"Bearer {self.cohere_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.cohere_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "response_format": {"type": "json_object"}
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post("https://api.cohere.com/v2/chat", json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    # Extract response content
                    message_content = data.get("message", {}).get("content", [])
                    if message_content and isinstance(message_content, list):
                        content_str = message_content[0].get("text", "").strip()
                    else:
                        content_str = str(message_content).strip()

                    if content_str.startswith("```json"):
                        content_str = content_str[7:].strip()
                    if content_str.endswith("```"):
                        content_str = content_str[:-3].strip()

                    parsed = json.loads(content_str)
                    logger.info(f"[Cohere AI: {self.cohere_model}] Successfully generated post content.")
                    return {
                        "text": parsed.get("text", f"Analyzing recent developments in {title}."),
                        "whyThisTopic": parsed.get("whyThisTopic", f"Critical technical shift in domain."),
                        "whyNow": parsed.get("whyNow", f"Surfaced via {source_name} live feed."),
                        "selectionReason": selection_reason,
                        "sources": [source_url]
                    }
                else:
                    logger.warning(f"Cohere API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Cohere post generation error: {e}")
        return None

    async def generate_post(
        self,
        persona_name: str,
        persona_domain: str,
        voice_description: Optional[str],
        topic: Dict[str, Any],
        selection_reason: str
    ) -> Dict[str, Any]:
        """
        Generates a post formatted with text, rationale (whyThisTopic, whyNow, selectionReason), and sources.
        Primary LLM: Cohere (command-a-03-2025) -> Fallback: OpenAI GPT / Structured Template Engine.
        """
        title = topic.get("title", "")
        snippet = topic.get("snippet", "")
        source_url = topic.get("url", "https://news.ycombinator.com")
        source_name = topic.get("source", "Live Tech Feed")
        
        system_persona_prompt = PersonaManager.get_persona_prompt(persona_name, persona_domain, voice_description)

        # 1. Primary: Cohere AI API (command-a-03-2025)
        cohere_result = await self._generate_with_cohere(
            system_prompt=system_persona_prompt,
            title=title,
            snippet=snippet,
            source_name=source_name,
            source_url=source_url,
            selection_reason=selection_reason
        )
        if cohere_result:
            return cohere_result

        # 2. Secondary: OpenAI LLM (if key provided)
        if self.llm:
            try:
                user_prompt = f"""
Write a new autonomous post based on this accepted topic:

Topic Title: {title}
Topic Context: {snippet}
Primary Source: {source_name} ({source_url})
Editorial Selection Reason: {selection_reason}

Respond ONLY in valid JSON matching this schema:
{{
  "text": "The full post text written strictly in your persona voice (2-3 paragraphs, punchy, opinionated, technical).",
  "whyThisTopic": "1-2 sentences explaining why this topic matters to your domain.",
  "whyNow": "1-2 sentences explaining why this is timely right now.",
  "selectionReason": "{selection_reason}"
}}
"""
                res = await self.llm.ainvoke([
                    {"role": "system", "content": system_persona_prompt},
                    {"role": "user", "content": user_prompt}
                ])
                
                content = res.content.strip()
                if content.startswith("```json"):
                    content = content[7:].strip()
                if content.endswith("```"):
                    content = content[:-3].strip()
                    
                parsed = json.loads(content)
                return {
                    "text": parsed.get("text", f"Analyzing recent developments in {title}."),
                    "whyThisTopic": parsed.get("whyThisTopic", f"Critical technical shift in {persona_domain}."),
                    "whyNow": parsed.get("whyNow", f"New empirical findings surfaced via {source_name}."),
                    "selectionReason": selection_reason,
                    "sources": [source_url]
                }
            except Exception as e:
                logger.warning(f"OpenAI Post Generation failed: {e}")

        # 3. Fallback: Structured Template Generator
        fallback_text = (
            f"When evaluating recent shifts in {persona_domain}, {title} demands immediate scrutiny. "
            f"The core issue isn't just theoretical—it directly impacts system architecture and reliability.\n\n"
            f"Key Takeaway: {snippet[:180]}...\n\n"
            f"As engineers, we must prioritize verifiable benchmarks over marketing claims. "
            f"If your stack relies on unvalidated assumptions here, expect hidden failure modes down the road."
        )
        
        return {
            "text": fallback_text,
            "whyThisTopic": f"Directly impacts operational posture and architecture in {persona_domain}.",
            "whyNow": f"Surfaced via {source_name} live feed with recent community focus.",
            "selectionReason": selection_reason,
            "sources": [source_url]
        }

post_generator = PostGenerator()
