import json
import logging
from typing import Dict, Any, List, Optional
from langchain_openai import ChatOpenAI
from app.config import settings
from app.agent.persona import PersonaManager

logger = logging.getLogger("generator")

class PostGenerator:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model_name = settings.LLM_MODEL
        if self.api_key:
            self.llm = ChatOpenAI(openai_api_key=self.api_key, model=self.model_name, temperature=0.7)
        else:
            self.llm = None

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
        """
        title = topic.get("title", "")
        snippet = topic.get("snippet", "")
        source_url = topic.get("url", "https://news.ycombinator.com")
        source_name = topic.get("source", "Live Tech Feed")
        
        system_persona_prompt = PersonaManager.get_persona_prompt(persona_name, persona_domain, voice_description)

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
                logger.warning(f"LLM Post Generation failed, using template generator: {e}")

        # Template fallback if LLM key is not provided
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
