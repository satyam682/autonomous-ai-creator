# Autonomous AI Creator — AI Usage Log (`PROMPTS.md`)

This file records the prompts, instructions, and architectural decisions logged throughout the development of the Autonomous AI Content Creator.

---

## 📅 Prompt Log

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

### 🔵 Prompt 3: Tech Stack Finalization & Repository Setup

* **Timestamp**: `2026-08-08 09:12:49 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
We are setting up the project repository for the Autonomous AI Creator.

[TASK]
Initialize the folder structure and setup PROMPTS.md with timestamps and C-T-R-C-O formatting.
Tech Stack details:
- Frontend: React + TypeScript + Vite (`frontend/`)
- Backend: Python with FastAPI + LangGraph/LangChain (`backend/`)

[ROLE]
Lead Full-Stack Developer & AI Systems Architect.

[CONSTRAINT]
Create standard project directory structure (`frontend/`, `backend/`), initialize `PROMPTS.md` with timestamps and C-T-R-C-O structured prompts, and present an implementation plan for full system architecture.

[OUTPUT]
Project folder setup, initialized `PROMPTS.md`, and complete implementation plan artifact.
```

---

### 🔵 Prompt 4: Neo-Brutalist UI Design & Live Search API Strategy

* **Timestamp**: `2026-08-08 09:30:39 IST`
* **Format**: C-T-R-C-O

```markdown
[CONTEXT]
The implementation plan is approved. The user requested:
1. Neo-Brutalist UI design for the frontend to create a striking, high-contrast, modern retro-futuristic aesthetic.
2. Strategy for live search APIs to win the hackathon.

[TASK]
Integrate Neo-Brutalist design system into the React frontend and architect a multi-tiered live discovery pipeline (Tavily AI Search + Hacker News API + arXiv AI API + DuckDuckGo fallback).

[ROLE]
Lead UI/UX Designer & AI Systems Architect.

[CONSTRAINT]
- Implement bold neo-brutalist styling (sharp drop shadows, high-contrast borders, neon accent badges, monospaced tech typography).
- Provide a robust multi-source live topic discovery engine ensuring 100% uptime and high signal-to-noise ratio.

[OUTPUT]
Complete backend implementation, Neo-Brutalist frontend UI, and end-to-end integration.
```
