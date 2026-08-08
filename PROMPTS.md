# Autonomous AI Creator — AI Usage Log (`PROMPTS.md`)

This file records the key prompts, architectural milestones, and major UI design decisions logged throughout the development of the Autonomous AI Content Creator.

---

## 📅 Major Milestone Prompts

### 🔵 Prompt 1: Project Framing & Requirement Breakdown
* **Timestamp**: `2026-08-08 08:58:32 IST`
* **Format**: C-T-R-C-O (Context - Task - Role - Constraint - Output)

```markdown
[CONTEXT]
I'm building a submission for a hackathon challenge called "Autonomous AI Creator." 
The goal is to build an autonomous AI persona (e.g., AI Security Researcher, ML Engineer, 
AI Product Analyst, Robotics Engineer, Developer Advocate, etc.) that publishes content 
about AI/technology WITHOUT any human prompting after setup.

Once initialized via a one-time API call, the agent must independently:
1. Discover trending AI/tech topics from live sources (web search, RSS, APIs, etc.)
2. Apply editorial judgment — actively reject topics that don't meet its bar, not just accept everything
3. Write in one consistent voice/personality/opinion style that never drifts
4. Remember what it already published, so it doesn't repeat itself
5. Publish gradually over ~48 hours (not all at once, not on-demand)
6. Attach a rationale to every post explaining: why this topic, why now, and which source(s) it came from

Technical shape:
- POST /api/agent/init → called once, takes {persona: {name, domain}}, returns {agentId}
- GET /api/agent/feed?agentId=... → called repeatedly by evaluators, returns 
  {posts: [{id, createdAt (ISO 8601 UTC), text, rationale, sources[]}]}, newest first
- No further human input allowed after init — everything after that must be autonomous
- Simulated publishing is fine; no need to post to real LinkedIn/X
- Out of scope: multi-agent systems, images/video, engagement analytics, multi-platform posting

[TASK]
Explain this project back to me in your own words — what exactly needs to be built, 
and what the core technical/architectural challenge is — so I can confirm you've 
understood it correctly before we start designing the system.

[ROLE]
AI Coding Assistant / Systems Architect Pair Programmer.

[CONSTRAINT]
- Don't propose solutions yet — this prompt is only for explanation/understanding, not implementation.
- Keep the explanation grounded strictly in what's stated above — no assumptions about tech stack yet.
- Flag anything ambiguous or underspecified in the requirements.

[OUTPUT]
A clear, structured plain-English explanation of the project (bullet points fine), 
followed by a short list of open questions or ambiguities you'd want clarified before design begins.
```

---

### 🔵 Prompt 2: Submission Checklist & PROMPTS.md Clarification
* **Timestamp**: `2026-08-08 09:05:38 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Submission checklist:
1. Public GitHub repo (full project source code).
2. Live deployed URL (Vercel, Netlify, Render, Railway, etc.).
3. AI-usage log (PROMPTS.md in repo or exported chat transcripts).

[TASK]
Explain how we fulfill these 3 requirements, specifically how PROMPTS.md works, what prompts should be included in PROMPTS.md, and how we will maintain it throughout the project.

[ROLE]
AI Coding Assistant / Systems Architect.

[CONSTRAINT]
Clear explanation of PROMPTS.md formatting, prompt structure, and workflow.

[OUTPUT]
Comprehensive guide and template for PROMPTS.md.
```

---

### 🔵 Prompt 3: Tech Stack Selection & Initial Repository Architecture
* **Timestamp**: `2026-08-08 09:12:49 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Finalized Tech Stack:
- Frontend: React + TypeScript + Vite (`frontend/`)
- Backend: Python with FastAPI + LangGraph/LangChain (`backend/`)

[TASK]
Initialize the folder structure and setup PROMPTS.md with timestamps and C-T-R-C-O formatting. Present an implementation plan for full system architecture.

[ROLE]
Lead Full-Stack Developer & AI Systems Architect.

[CONSTRAINT]
Create standard project directory structure (`frontend/`, `backend/`), initialize `PROMPTS.md` with timestamps and C-T-R-C-O structured prompts, and present an implementation plan artifact.

[OUTPUT]
Project folder setup, initialized `PROMPTS.md`, and complete implementation plan artifact.
```

---

### 🔵 Prompt 4: Multi-Source Live Search API Engine Strategy
* **Timestamp**: `2026-08-08 09:30:39 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
To ensure maximum signal-to-noise ratio and 100% uptime during hackathon evaluation, the discovery engine needs a resilient, multi-tiered live search architecture.

[TASK]
Architect a multi-source topic discovery pipeline combining Tavily AI Search API, official Hacker News API (`/v0/topstories.json`), arXiv AI papers API, and live RSS feeds with fallback mechanisms.

[ROLE]
AI Systems Architect & Data Pipeline Engineer.

[CONSTRAINT]
- Support Tavily Search for real-time web discovery.
- Integrate free live technical feeds (Hacker News, arXiv AI papers) for guaranteed uptime.
- Enforce strict topic deduplication against persistent SQLite memory.

[OUTPUT]
Multi-source live discovery engine and memory integration in `discovery.py` and `memory.py`.
```

---

### 🔵 Prompt 5: High-Fidelity NOVA Neo-Brutalist Dashboard Redesign
* **Timestamp**: `2026-08-08 09:50:53 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Redesign the React frontend dashboard to match the exact high-fidelity "NOVA AUTONOMOUS AI CREATOR" Neo-Brutalist UI layout design mockup.

[TASK]
Implement a pixel-perfect, responsive Neo-Brutalist dashboard featuring dark left sidebar with bracketed logo, action button row, persona cards with portrait avatars, stat cards, feed with tags, 48h timeline visual, filter funnel status, and live top sources.

[ROLE]
Senior UI/UX Engineer & Frontend Specialist.

[CONSTRAINT]
- Replicate the exact visual hierarchy, sharp 3px black borders, offset drop shadows, neon accents, and typography.
- Use generated ink stipple portrait avatars for persona cards.

[OUTPUT]
Redesigned `App.tsx` and updated `index.css` matching the target mockup.
```

---

### 🔵 Prompt 6: Complete End-to-End System Architecture & LangGraph State Machine
* **Timestamp**: `2026-08-08 09:58:36 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
The evaluator will hit only two thin REST endpoints (`POST /api/agent/init` and `GET /api/agent/feed`), but internally the agent must run continuously and autonomously for ~48 hours, cycling through: discover → filter/judge → write → store → schedule next run — all without any further human prompting or API triggers.

[TASK]
Design and implement the full end-to-end system architecture using a LangGraph state machine (`discover` -> `judge` -> `generate` -> `store`), an async APScheduler background loop, persistent SQLite memory (`agent_memory.db`), and thin FastAPI endpoints.

[ROLE]
Lead Full-Stack Developer & AI Systems Architect.

[CONSTRAINT]
- `/init` and `/feed` endpoints must remain thin and non-blocking.
- Background scheduler runs independently over ~48 hours.
- Database persists agents, posts, rejected topics, and topic fingerprints.
- LangGraph graph state machine manages stage transitions.

[OUTPUT]
LangGraph state machine graph in `graph.py`, updated APScheduler runner in `scheduler.py`, thin API endpoints in `main.py`, and complete architecture document.
```

---

### 🔵 Prompt 7: Complete Multi-View Platform Suite & Simulated Feed Experience
* **Timestamp**: `2026-08-08 18:40:48 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
The hackathon evaluators require simulated publishing (no real social posting required). We need a dedicated Simulated Feed Platform layout and dedicated interactive views for all sidebar sections (`DECISIONS`, `SOURCES`, `TIMELINE`, `VAULT`, `SETTINGS`).

[TASK]
Implement a complete Neo-Brutalist platform suite featuring simulated social creator feed cards, curation matrix, live source stream monitor, 48-hour timeline visualizer, persistent SQLite memory vault, and settings panel.

[ROLE]
Lead Full-Stack UI/UX Specialist & Systems Architect.

[CONSTRAINT]
- Maintain 100% Neo-Brutalist design aesthetic.
- Ensure all sidebar navigation links render dedicated, fully functional views.

[OUTPUT]
Expanded `App.tsx` and `index.css` with simulated feed cards and 5 dedicated view modules.
```

---

### 🔵 Prompt 8: Breeth Cloud Memory & Graph Infrastructure Integration
* **Timestamp**: `2026-08-08 19:24:52 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Connect the Autonomous AI Creator backend agent to Breeth Memory Cloud Infrastructure (`ck_live_6uN6aPr_hskvcXNjUvqfnc9GruWOCDB9EAj8-bSEWd0`) for cloud persistent memory, intent tracking, and knowledge graph knot creation.

[TASK]
Integrate Breeth API client into `breeth.py` and LangGraph state machine `graph.py` so that every autonomous discovery cycle logs WRITES, INTENTS, RETRIEVALS, and KNOTS live to the Breeth dashboard.

[ROLE]
AI Infrastructure & Cloud Systems Specialist.

[CONSTRAINT]
- Save Breeth API Key securely in `.env`.
- Ensure async, non-blocking Breeth API integration.

[OUTPUT]
Breeth API client in `breeth.py`, updated `config.py` and `graph.py`, and updated `PROMPTS.md`.
```

---

### 🔵 Prompt 9: Cohere AI (`command-a-03-2025`) & Tavily Search API Integration
* **Timestamp**: `2026-08-08 19:29:05 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Integrate Tavily Search API (`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`) for real-time web discovery and Cohere AI (`cohere_z7kmuhS8J5eVryQQvjLd5WfWXe3Zzs4ZdpPapFlv2d4fp6`, model: `command-a-03-2025`) for LLM post content and rationale generation.

[TASK]
Update `generator.py` and `config.py` to route accepted topics through Cohere Chat API (`command-a-03-2025`), generating high-signal technical post text and structured rationale (`whyThisTopic`, `whyNow`, `selectionReason`) in persona voice.

[ROLE]
AI Systems Engineer & LLM Pipeline Architect.

[CONSTRAINT]
- Store Tavily & Cohere API keys in `.env`.
- Parse Cohere V2 Chat JSON object response format cleanly.

[OUTPUT]
Updated `generator.py`, `config.py`, `backend/.env`, and `PROMPTS.md`.
```
