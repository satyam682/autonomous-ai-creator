import sqlite3
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.config import settings

class MemoryStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DB_PATH
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Agents table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS agents (
                    agent_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    domain TEXT NOT NULL,
                    voice_description TEXT,
                    created_at TEXT NOT NULL,
                    status TEXT NOT NULL
                )
            """)
            
            # Posts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS posts (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    text TEXT NOT NULL,
                    why_this_topic TEXT NOT NULL,
                    why_now TEXT NOT NULL,
                    selection_reason TEXT NOT NULL,
                    sources_json TEXT NOT NULL,
                    topic_keywords TEXT,
                    FOREIGN KEY(agent_id) REFERENCES agents(agent_id)
                )
            """)
            
            # Editorial logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS editorial_logs (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    topic_title TEXT NOT NULL,
                    score REAL NOT NULL,
                    decision TEXT NOT NULL,
                    rejection_reason TEXT,
                    sources_json TEXT NOT NULL,
                    FOREIGN KEY(agent_id) REFERENCES agents(agent_id)
                )
            """)

            # Published topic fingerprints for deduplication
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS topic_fingerprints (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT NOT NULL,
                    fingerprint TEXT NOT NULL,
                    published_at TEXT NOT NULL
                )
            """)
            conn.commit()

    # --- Agent Operations ---
    def save_agent(self, agent_id: str, name: str, domain: str, voice_description: str) -> Dict[str, Any]:
        now_utc = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO agents (agent_id, name, domain, voice_description, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (agent_id, name, domain, voice_description, now_utc, "ACTIVE"))
            conn.commit()
        return {
            "agentId": agent_id,
            "persona": {"name": name, "domain": domain, "voice_description": voice_description},
            "createdAt": now_utc,
            "status": "ACTIVE"
        }

    def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents WHERE agent_id = ?", (agent_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "agentId": row["agent_id"],
                "name": row["name"],
                "domain": row["domain"],
                "voice_description": row["voice_description"],
                "createdAt": row["created_at"],
                "status": row["status"]
            }

    def get_latest_agent(self) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents ORDER BY created_at DESC LIMIT 1")
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "agentId": row["agent_id"],
                "name": row["name"],
                "domain": row["domain"],
                "voice_description": row["voice_description"],
                "createdAt": row["created_at"],
                "status": row["status"]
            }

    # --- Post Operations ---
    def save_post(
        self, 
        agent_id: str, 
        text: str, 
        why_this_topic: str, 
        why_now: str, 
        selection_reason: str, 
        sources: List[str], 
        keywords: Optional[List[str]] = None,
        custom_created_at: Optional[str] = None
    ) -> Dict[str, Any]:
        post_id = f"post_{uuid.uuid4().hex[:8]}"
        created_at = custom_created_at or datetime.now(timezone.utc).isoformat()
        sources_json = json.dumps(sources)
        keywords_str = ",".join(keywords) if keywords else ""
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO posts (id, agent_id, created_at, text, why_this_topic, why_now, selection_reason, sources_json, topic_keywords)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (post_id, agent_id, created_at, text, why_this_topic, why_now, selection_reason, sources_json, keywords_str))
            
            # Save fingerprint for deduplication
            fingerprint = f"{why_this_topic[:50]} {keywords_str}".lower().strip()
            cursor.execute("""
                INSERT INTO topic_fingerprints (id, agent_id, fingerprint, published_at)
                VALUES (?, ?, ?, ?)
            """, (str(uuid.uuid4()), agent_id, fingerprint, created_at))
            
            conn.commit()

        return {
            "id": post_id,
            "createdAt": created_at,
            "text": text,
            "rationale": {
                "whyThisTopic": why_this_topic,
                "whyNow": why_now,
                "selectionReason": selection_reason
            },
            "sources": sources
        }

    def get_feed(self, agent_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM posts WHERE agent_id = ? ORDER BY created_at DESC
            """, (agent_id,))
            rows = cursor.fetchall()
            
            posts = []
            for row in rows:
                posts.append({
                    "id": row["id"],
                    "createdAt": row["created_at"],
                    "text": row["text"],
                    "rationale": {
                        "whyThisTopic": row["why_this_topic"],
                        "whyNow": row["why_now"],
                        "selectionReason": row["selection_reason"]
                    },
                    "sources": json.loads(row["sources_json"])
                })
            return posts

    # --- Editorial Logs ---
    def save_editorial_log(
        self, 
        agent_id: str, 
        topic_title: str, 
        score: float, 
        decision: str, 
        rejection_reason: Optional[str] = None, 
        sources: Optional[List[str]] = None
    ):
        log_id = f"log_{uuid.uuid4().hex[:8]}"
        now_utc = datetime.now(timezone.utc).isoformat()
        sources_json = json.dumps(sources or [])
        
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO editorial_logs (id, agent_id, timestamp, topic_title, score, decision, rejection_reason, sources_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (log_id, agent_id, now_utc, topic_title, score, decision, rejection_reason, sources_json))
            conn.commit()

    def get_editorial_logs(self, agent_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM editorial_logs WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?
            """, (agent_id, limit))
            rows = cursor.fetchall()
            
            logs = []
            for r in rows:
                logs.append({
                    "id": r["id"],
                    "timestamp": r["timestamp"],
                    "topicTitle": r["topic_title"],
                    "score": r["score"],
                    "decision": r["decision"],
                    "rejectionReason": r["rejection_reason"],
                    "sources": json.loads(r["sources_json"])
                })
            return logs

    # --- Deduplication Memory Checks ---
    def is_duplicate_topic(self, agent_id: str, candidate_text: str, candidate_keywords: List[str]) -> bool:
        """
        Checks if candidate topic or keywords overlap significantly with already published content.
        """
        candidate_words = set([w.lower() for w in candidate_keywords if len(w) > 3])
        if not candidate_words:
            candidate_words = set(candidate_text.lower().split())

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT text, why_this_topic, topic_keywords FROM posts WHERE agent_id = ?
            """, (agent_id,))
            rows = cursor.fetchall()
            
            for row in rows:
                existing_keywords = set((row["topic_keywords"] or "").lower().split(","))
                existing_text = (row["text"] + " " + row["why_this_topic"]).lower()
                
                # Check keyword overlap ratio
                if candidate_words and existing_keywords:
                    overlap = candidate_words.intersection(existing_keywords)
                    if len(overlap) >= 2 or (len(candidate_words) <= 3 and len(overlap) >= 1):
                        return True
                        
                # Direct string containment check for core subjects
                matched_count = sum(1 for word in candidate_words if word in existing_text)
                if len(candidate_words) > 0 and (matched_count / len(candidate_words)) > 0.6:
                    return True

        return False

db_memory = MemoryStore()
