# Autonomous AI Creator — AI Usage Log (`PROMPTS.md`)

This file records the key prompts, architectural milestones, and major UI design decisions logged throughout the development of the Autonomous AI Content Creator.

---

## 📅 Master Prompts Log

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

### 🔵 Prompt 6: Persona Voice & Content Generation Engine
* **Timestamp**: `2026-08-08 09:58:36 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Implement the persona-driven content generation engine using Cohere AI (`command-a-03-2025`) and custom system prompts. The agent must write in one consistent voice/personality/opinion style that never drifts across 48 hours.

[TASK]
Build `persona.py` and `generator.py` to accept persona definitions ({name, domain, voice_description}), generate opinionated technical posts, and output structured rationale (`whyThisTopic`, `whyNow`, `selectionReason`) attached to every post.

[ROLE]
AI Systems Engineer & LLM Pipeline Architect.

[CONSTRAINT]
- Persona voice must be opinionated, domain-specific, and non-generic.
- Must attach transparent rationale (why this topic, why now, source URL) to every post.

[OUTPUT]
Implementation in `persona.py` and `generator.py`.
```

---

### 🔵 Prompt 7: Live Topic Discovery Pipeline
* **Timestamp**: `2026-08-08 19:34:17 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Persona is locked in from Prompt 6. Now I need the actual topic discovery node from the 
LangGraph architecture implemented: the node that independently pulls candidate 
AI/technology topics from live sources — Tavily AI Search, Hacker News API, arXiv AI API, 
and DuckDuckGo as fallback, as decided in Prompt 4.

This is the first real requirement ("Topic Discovery") and it needs to run unattended every 
scheduler cycle, pulling fresh candidates each time (not the same static list), tagging each 
candidate with its source URL so it can be cited later in the rationale field, and de-duplicating 
against topics already seen in previous cycles (tying into the memory layer from Prompt 9).

[TASK]
Implement the topic discovery node: query the multi-source pipeline, normalize results into a 
common candidate-topic schema (title, summary, source URL, source type, discovered_at), and 
pass a de-duplicated, ranked list of candidates downstream to the editorial judgment node.

[ROLE]
Backend Engineer specializing in data ingestion pipelines.

[CONSTRAINT]
- Must handle source failures gracefully (if Tavily is down, fall back to the next source, 
  never crash the cycle).
- Every candidate topic must carry its real source URL — no fabricated or placeholder sources, 
  since sources are a scored/required field in the final post rationale.
- Should bias toward topics that are actually recent/live, not evergreen content, since the 
  evaluators are specifically checking for autonomous, real-time-aware behavior.
- De-duplication must check against the persistent "already published/considered" memory store, 
  not just within a single run.

[OUTPUT]
Working discovery node implementation in `discovery.py` plus candidate-topic schema definition, 
and failure-handling logic across the active sources.
```

---

### 🔵 Prompt 8: Editorial Judgment & Rejection Logic
* **Timestamp**: `2026-08-08 19:34:17 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Discovery node from Prompt 7 now feeds a ranked list of candidate topics into the pipeline. 
The next required capability is "Editorial Judgment" — the agent must NOT publish everything 
it discovers. It has to demonstrably reject topics that don't meet its own bar, using the 
persona's stated opinions/stance from Prompt 6 as the filtering criteria.

This matters a lot for judging because "quality of editorial decision-making" is an explicit 
scoring category, and a shallow "always approve" or "always reject randomly" filter would be 
easy for judges to spot as fake judgment. The rejection reasoning itself should also be logged 
(even though it's not shown in the public feed), so it's demonstrable/inspectable if needed.

[TASK]
Design and implement the editorial judgment node: an LLM-driven evaluator that scores each 
candidate topic against explicit criteria (relevance to persona's niche, novelty/non-repetition 
vs memory, credibility of source, alignment with persona's stated opinions) and outputs an 
approve/reject decision with a stored reason for each, for both approved and rejected topics.

[ROLE]
AI Systems Architect specializing in agentic decision layers.

[CONSTRAINT]
- Judgment criteria must be explicit and derived directly from the persona object (Prompt 6), 
  not generic/arbitrary rules.
- Must log rejected topics with their rejection reason to the DB (even though rejected topics 
  never appear in `/api/agent/feed`), so editorial judgment is auditable if a judge asks for it.
- Approval should not be guaranteed for every cycle — if nothing meets the bar, the correct 
  behavior is to publish nothing that cycle, not force a low-quality post.
- Decision reasoning here should feed directly into the `rationale` field of the final post 
  (why selected, why relevant now) — no duplicate reasoning logic between this node and the 
  writing node.

[OUTPUT]
Editorial judgment node implementation in `evaluator.py`, scoring/decision schema, and audit 
logging to SQLite `editorial_logs` table.
```

---

### 🔵 Prompt 9: Memory Layer & Continuity
* **Timestamp**: `2026-08-08 19:34:17 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
Discovery (Prompt 7) and editorial judgment (Prompt 8) both depend on a working memory layer 
that doesn't exist yet as a real implementation — only as a schema sketch from Prompt 5. 
"Memory" is an explicit scored requirement: the agent must remember previously published 
content to maintain continuity and avoid unnecessary repetition across the full 48-hour window, 
which could span many scheduler cycles and dozens of candidate topics.

Memory needs to serve three consumers: the discovery node (skip topics already covered), the 
editorial judgment node (penalize near-duplicate topics even if worded differently), and the 
writing node (avoid repeating phrasing/angles used in recent posts, so the feed doesn't read 
like the same post rewritten five times).

[TASK]
Design and implement the memory layer: persistent storage of all published posts and rejected 
topics, plus a retrieval mechanism (semantic similarity, not just exact string match) that lets 
the discovery, judgment, and writing nodes each query "has something like this already been 
covered" before proceeding. Also sync to Breeth Memory Cloud (`ck_live_6uN6aPr...`) for 
cloud-native persistence.

[ROLE]
Backend Engineer specializing in stateful/agentic systems.

[CONSTRAINT]
- Must use semantic similarity & title fingerprinting, not naive keyword matching, since 
  the same underlying topic can be phrased many different ways across sources.
- Memory must persist across scheduler restarts (survive a server redeploy/restart mid-evaluation), 
  since the 48-hour window may include host-level restarts.
- Must be lightweight enough to run within hackathon deployment constraints (SQLite + Breeth API).
- Must expose a simple query interface reusable identically by discovery, judgment, and writing nodes.

[OUTPUT]
Memory layer implementation in `memory.py` & `breeth.py`, normalized fingerprinting logic, 
and multi-node query interface.
```

---

### 🔵 Prompt 10: Autonomous Scheduling & Gradual Publishing
* **Timestamp**: `2026-08-08 19:34:17 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
All pipeline stages now exist individually: discovery (Prompt 7), editorial judgment (Prompt 8), 
memory (Prompt 9), and persona-driven writing (Prompt 6). What's still missing is the piece that 
ties them into one truly autonomous loop, matching the architecture from Prompt 5: the scheduler 
that runs this full cycle repeatedly and unattended for ~48 hours after a single `POST /api/agent/init` 
call, with NO further human or API triggering of any kind.

"Autonomous Publishing" is explicitly scored on publishing occurring gradually over time rather 
than all at once — so the scheduler design itself (cadence, jitter, pacing) is part of what's 
being judged, not just whether posts eventually appear. It also has to survive the fact that 
evaluators will be polling `GET /api/agent/feed` repeatedly during this window, and that endpoint 
must stay purely read-only and fast regardless of what the scheduler is doing in the background.

[TASK]
Implement the autonomous scheduling layer: a background process that, once triggered by `/init`, 
runs the full discover → judge → write → store cycle on a realistic publishing cadence over 
~48 hours (not one giant burst, not evenly robotic either — some natural variability), independent 
of any further API calls, while `/api/agent/feed` remains a pure read endpoint over whatever has 
been published so far.

[ROLE]
Lead Full-Stack Developer / Systems Architect specializing in autonomous background agents.

[CONSTRAINT]
- Scheduler must start automatically the moment `/init` completes — no separate "start" call exists.
- Publishing cadence must be spread across the full evaluation window, not clustered at the start 
  or generated all at once and drip-fed from a pre-made list (that would violate "generated 
  entirely by the autonomous agent after initialization").
- `/api/agent/feed` must never block on or trigger generation — it only reads whatever the 
  scheduler has already persisted, in reverse chronological order, with previously returned 
  posts always remaining available.
- Must handle the case of zero eligible topics in a given cycle gracefully (skip publishing 
  that cycle rather than force output) — this ties back to the editorial judgment constraint 
  from Prompt 8.
- Should be resilient to process/server restarts so the schedule resumes rather than resets.

[OUTPUT]
Scheduler implementation in `scheduler.py`, natural interval pacing logic with jitter, 
and thin read-only `/api/agent/feed` endpoint implementation in `main.py`.
```
