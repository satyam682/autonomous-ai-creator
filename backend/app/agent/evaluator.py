import json
import logging
from typing import List, Dict, Any, Tuple, Optional
from langchain_openai import ChatOpenAI
from app.config import settings
from app.agent.memory import db_memory

logger = logging.getLogger("evaluator")

class EditorialEvaluator:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model_name = settings.LLM_MODEL
        if self.api_key:
            self.llm = ChatOpenAI(openai_api_key=self.api_key, model=self.model_name, temperature=0.2)
        else:
            self.llm = None

    async def evaluate_candidate(
        self, 
        agent_id: str, 
        persona_name: str, 
        persona_domain: str, 
        candidate: Dict[str, Any]
    ) -> Tuple[bool, float, str, List[str]]:
        """
        Evaluates a candidate topic. Returns:
        (is_accepted: bool, score: float, reason: str, keywords: List[str])
        """
        title = candidate.get("title", "")
        snippet = candidate.get("snippet", "")
        source_url = candidate.get("url", "")
        
        # 1. Deduplication Memory Check
        keywords = [w.strip() for w in title.split() if len(w.strip()) > 3]
        if db_memory.is_duplicate_topic(agent_id, f"{title} {snippet}", keywords):
            reason = f"REJECTED: Topic '{title[:40]}...' duplicates previously published content or core concepts."
            db_memory.save_editorial_log(
                agent_id=agent_id,
                topic_title=title,
                score=3.5,
                decision="REJECTED",
                rejection_reason=reason,
                sources=[source_url] if source_url else []
            )
            return False, 3.5, reason, keywords

        # 2. LLM Curation Filter or Heuristic Rules
        if self.llm:
            try:
                prompt = f"""
YOU ARE AN ELITE EDITORIAL BOARD CHAIR EVALUATING A CANDIDATE TECH TOPIC FOR AN AUTONOMOUS AI PERSONA.

Persona: {persona_name}
Domain: {persona_domain}

Candidate Topic Title: {title}
Candidate Snippet: {snippet}

Evaluate this topic strictly on a scale of 0 to 10 based on:
1. Relevance to domain '{persona_domain}'
2. Timeliness & technical depth (is this valuable signal or generic noise?)
3. Suitability for an opinionated expert post

Respond ONLY in valid JSON matching this exact structure:
{{
  "score": 8.5,
  "decision": "ACCEPTED" or "REJECTED",
  "reason": "Detailed editorial rationale for acceptance or rejection",
  "keywords": ["keyword1", "keyword2"]
}}
"""
                res = await self.llm.ainvoke(prompt)
                content = res.content.strip()
                # Clean code blocks if present
                if content.startswith("```json"):
                    content = content[7:].strip()
                if content.endswith("```"):
                    content = content[:-3].strip()
                    
                parsed = json.loads(content)
                score = float(parsed.get("score", 5.0))
                decision = parsed.get("decision", "REJECTED")
                reason = parsed.get("reason", "Editorial evaluation completed.")
                parsed_keywords = parsed.get("keywords", keywords)
                
                is_accepted = (decision == "ACCEPTED") and (score >= 6.5)
                
                db_memory.save_editorial_log(
                    agent_id=agent_id,
                    topic_title=title,
                    score=score,
                    decision="ACCEPTED" if is_accepted else "REJECTED",
                    rejection_reason=None if is_accepted else reason,
                    sources=[source_url] if source_url else []
                )
                
                return is_accepted, score, reason, parsed_keywords

            except Exception as e:
                logger.warning(f"LLM Evaluation failed, falling back to heuristic scoring: {e}")

        # 3. Fast Heuristic Scoring (if LLM API key not set)
        domain_terms = persona_domain.lower().split()
        title_lower = title.lower() + " " + snippet.lower()
        match_score = sum(2.0 for term in domain_terms if term in title_lower and len(term) > 3)
        score = min(9.5, max(6.0, 6.5 + match_score))
        
        # Actively reject topics that don't match domain keywords well
        if "generic" in title_lower or "beginner" in title_lower or score < 6.5:
            reason = f"REJECTED: Topic lacks sufficient technical depth or alignment with {persona_domain}."
            db_memory.save_editorial_log(
                agent_id=agent_id,
                topic_title=title,
                score=4.0,
                decision="REJECTED",
                rejection_reason=reason,
                sources=[source_url] if source_url else []
            )
            return False, 4.0, reason, keywords
        
        db_memory.save_editorial_log(
            agent_id=agent_id,
            topic_title=title,
            score=score,
            decision="ACCEPTED",
            rejection_reason=None,
            sources=[source_url] if source_url else []
        )
        return True, score, f"ACCEPTED: High relevance score ({score}/10) for {persona_domain}.", keywords

evaluator = EditorialEvaluator()
