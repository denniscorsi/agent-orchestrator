# PRD: Tether Agent Dashboard

**Author:** Dennis Corsi  
**Date:** April 14, 2026  
**Status:** Draft — for engineering  
**Platform:** Web app (standalone, separate from Tether admin panel)

---

## Overview

Tether runs a small team of AI agents — Market Researcher, CFO, and Partnerships Scout — that operate autonomously, produce reports, and communicate with each other via a shared file system. Today, interacting with them requires manually writing markdown files into the right folders and digging through directories to find their outputs. This dashboard replaces all of that with a clean web UI.

**The core job:** Let Dennis read what his agents have produced, send them tasks and messages, trigger them on demand, and know in real time when something new comes in — without touching the filesystem directly.

---

## Background

### How the Agent System Works Today

The agent company lives in `/Tether/company/` with this structure:

```
company/
├── COMPANY.md                  ← shared context all agents read
├── shared/
│   ├── inbox/                  ← async inter-agent + human-to-agent messages
│   ├── research/               ← Market Researcher outputs
│   ├── partnerships/           ← Partnerships Scout outputs
│   ├── finance/                ← CFO outputs
│   ├── decisions/              ← logged decisions
│   └── reports/                ← finished deliverables for Dennis
└── agents/
    ├── market-researcher/
    ├── partnerships-scout/
    └── cfo/
```

**Agents** are Claude scheduled tasks (via the Cowork desktop app). They run on a schedule or on demand, read the company folder, do research or analysis, write output files, and leave messages in `shared/inbox/` for other agents.

**Messaging protocol:** Inbox messages are markdown files named `{recipient}-from-{sender}-{YYYY-MM-DD}.md`. Agents check their inbox when they run and archive messages they've processed.

**Dennis's role today:** He reads output files manually, and to send a task to an agent he must create a markdown file in `shared/inbox/` by hand. This is the primary friction this dashboard eliminates.

### Current Agents

| Agent | Schedule | What it does |
|---|---|---|
| **Market Researcher** | Weekly (Mondays 8am) | Competitive intelligence, trends, TAM/SAM analysis |
| **CFO** | Weekly (Mondays 8am) | Revenue modeling, cost tracking, financial scenarios |
| **Partnerships Scout** | On-demand (manual) | Distribution, integration, and co-marketing opportunities |

---

## Goals

1. **Eliminate filesystem friction.** Dennis should never need to navigate folders or write raw markdown to interact with his agents.
2. **Surface outputs immediately.** Reports and inbox messages should appear in a feed as soon as they're written to disk.
3. **Make task assignment feel like Slack.** Pick an agent, type a message, send. The dashboard handles writing the correctly formatted inbox file.
4. **Enable on-demand execution.** A "Run now" button per agent, so Dennis can trigger any agent without leaving the dashboard.
5. **Notify proactively.** Real-time or near-real-time notifications when a new report drops or a new message arrives.

---

## Non-Goals (v1)

- This is not a generalized multi-project tool. It is built for Tether's agent structure.
- This does not replace the Tether admin panel (user management, token usage, etc.). Those are separate concerns.
- This does not provide chat with an LLM. It is a UI for human ↔ agent coordination, not conversation.
- This does not manage agent prompts or scheduling configuration (that stays in Cowork).
- No mobile app in v1.

---

## User

**Dennis Corsi** — the sole user of this dashboard. He is the founder of Tether, non-technical enough to want a UI for this, technical enough to run a local web server and understand what agents are doing at a high level.

---

## Core Features

### 1. Agent Roster (Sidebar / Home)

A persistent sidebar lists all three agents with their status at a glance:

- Agent name and role (1-line description)
- Schedule (e.g., "Weekly — Mondays 8am" or "On-demand")
- Last run time (relative: "3 days ago")
- Status badge: `idle` / `running` / `needs attention` (e.g., unread messages)
- **"Run now" button** — triggers the agent immediately

Clicking an agent opens that agent's detail view.

**Technical note:** "Last run time" and "running" status come from watching the filesystem for recent writes to `agents/{name}/` or from the Cowork scheduled task API. The "Run now" button calls the Cowork API to trigger the scheduled task.

---

### 2. Reports Feed (Main View)

The default view is a chronological feed of all reports filed to `shared/reports/`. Each report appears as a **card** with:

- Report title (inferred from the H1 or filename)
- Agent that wrote it (with icon/color)
- Date written
- **Executive summary** — the 3-5 sentence summary from the top of the report
- **"Read more" button** — opens the full report in a rendered markdown panel

The full report view renders markdown properly: headers, bullet points, bold, links. It does not just show raw text.

**Filtering:** The feed can be filtered by agent (show only CFO reports, etc.) or by date range. Default is all agents, most recent first.

**Unread state:** Reports seen for the first time are marked unread (subtle indicator). Once opened, they're marked read.

---

### 3. Inbox

A unified inbox showing:

- Messages agents have left for each other (`shared/inbox/`)
- Messages Dennis has sent to agents (written by the dashboard on his behalf)
- Replies or follow-up messages

Each message is a card showing:
- To / From
- Date
- Subject (the `Re:` line from the markdown file)
- First 2-3 lines of body
- "Read full message" expands inline

Dennis can also see which messages have been archived (processed) by the receiving agent and which are still pending in the inbox.

---

### 4. Message Composer (Send a Task)

A compose button (prominent, always accessible) opens a message drawer:

- **To:** dropdown of agents (Market Researcher, CFO, Partnerships Scout) + a "All agents" broadcast option
- **Subject/Re:** short text field
- **Message:** freeform text area
- **Send** — writes the correctly formatted markdown file to `shared/inbox/` (e.g., `cfo-from-dennis-2026-04-14.md`) following the established naming convention

The message appears immediately in the Inbox view. If "All agents" is selected, one file is written per agent.

No threading, no reply-chains in v1. Messages are asynchronous.

---

### 5. Notifications

When the dashboard is open (or running in the background as a tab), it watches the filesystem for new files in:

- `shared/reports/` — new report from any agent
- `shared/inbox/` — new message (from another agent or inbound for Dennis to see)

When a new file appears, show a **browser notification** (using the Web Notifications API, with user permission) and a badge on the relevant section of the UI. Notification includes: who wrote it, what folder it's in, and the first line of the file.

**Polling interval:** Watch for changes every 10–30 seconds (filesystem polling or a lightweight backend watcher). Real-time is ideal; near-real-time (30s lag) is acceptable for v1.

---

### 6. Agent Detail View

Clicking an agent from the sidebar shows:

- Name, role, schedule
- Last run time + run history (list of recent runs with timestamps)
- Their memory file (`agents/{name}/memory.md`) rendered as markdown — this shows what the agent "remembers" across runs
- All reports they've produced (filtered view of the reports feed)
- All messages they've sent or received (filtered inbox view)
- **"Run now"** button (same as sidebar)
- **"Send message"** button (pre-fills the To: field in the composer)

---

### 7. Hire a New Agent

A "Hire" button (accessible from the sidebar or agent roster) opens a multi-step wizard for creating a new agent from scratch. The wizard collects everything needed to instantiate a fully functional agent: its files, scheduled task, and company handbook entry.

**Step 1 — Identity**
- **Name** — what this agent is called (e.g., "Head of Growth", "Legal Advisor")
- **Role description** — one sentence describing what this agent does (used in `COMPANY.md` and the dashboard sidebar)
- **Output folder** — where this agent writes its deliverables (e.g., `shared/growth/`). Can pick from existing folders or create a new one.

**Step 2 — Schedule**
- **Run schedule** — dropdown: On-demand only / Daily / Weekly (with day picker) / Monthly
- If a recurring schedule is chosen, pick the day and time

**Step 3 — Instructions (Prompt)**
- A large text area for the agent's full task prompt — what it should do when it runs, what it should read, what it should produce, how it should format output
- A **template** option pre-fills this with a generic agent prompt following the conventions already established in the other three agents (reads `COMPANY.md`, checks inbox, writes output to its folder, follows report format, ends with 3 actionable recommendations for Dennis)
- Dennis can edit freely from the template

**Step 4 — Review & Hire**
- Summary card showing all configuration
- A **"Hire"** confirmation button

**On confirmation, the dashboard:**
1. Creates the agent's directory: `agents/{agent-slug}/`
2. Creates an empty `memory.md` in that directory
3. Creates the output folder in `shared/{output-folder}/` if it doesn't exist
4. Appends the new agent's row to the Team table in `COMPANY.md`
5. Registers the scheduled task via the Cowork API with the provided prompt and schedule
6. The new agent appears immediately in the sidebar

**Design note:** Frame this as "hiring" throughout the UI. The button says "Hire new agent", the wizard header says "New hire", the confirmation says "Welcome aboard." This keeps the mental model of a company team intact and makes the experience feel deliberate rather than technical.

---

## Technical Architecture

### Stack

Follow the same stack as the existing Tether admin panel for consistency:

- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Lightweight Node.js/Express server (or even a thin file-watcher process)
- **File system access:** The backend reads and writes directly to the `company/` folder on disk

### Backend Responsibilities

The backend is minimal — it is essentially a filesystem API and watcher:

| Endpoint | What it does |
|---|---|
| `GET /reports` | List all files in `shared/reports/`, return metadata + content |
| `GET /inbox` | List all files in `shared/inbox/`, return metadata + content |
| `POST /inbox` | Write a new inbox file (Dennis sending a message to an agent) |
| `GET /agents` | Return agent list with last-modified time from their directories |
| `POST /agents/:id/run` | Trigger the agent via Cowork's scheduled task API |
| `GET /agents/:id/memory` | Return the agent's `memory.md` file content |
| `POST /agents` | Create a new agent: write directories, update COMPANY.md, register Cowork task |
| `GET /events` (SSE) | Server-sent events stream for real-time file change notifications |

The backend uses a filesystem watcher (e.g., `chokidar`) on the `company/` folder to detect new files and push events to connected clients via SSE. This eliminates polling from the frontend.

### File Writing Convention

When Dennis sends a message via the composer, the backend writes a file to `shared/inbox/` following the established naming convention:

```
{recipient}-from-dennis-{YYYY-MM-DD}.md
```

File content follows the same markdown format the agents use:

```markdown
# Message: {subject}

**To:** {Agent Name}
**From:** Dennis
**Date:** {date}
**Re:** {subject}

---

{message body}
```

If "All agents" is selected, write one file per agent with the respective recipient name.

### Triggering Agents

The "Run now" button calls the Cowork scheduled task API. Based on the existing infrastructure, this is the same API that powers the scheduled tasks sidebar. The backend proxies this call. The exact API contract should be confirmed with the Cowork team, but the call should be something like:

```
POST /api/triggers/{taskId}/run
```

This should return immediately; the agent runs asynchronously.

### Running the Dashboard

The dashboard runs as a separate local web server on a port distinct from the Tether API (e.g., port 4001). Dennis starts it with a script:

```bash
npm run dashboard
```

This starts both the backend watcher/API and serves the frontend. It should be documented in a `README.md` at the dashboard root.

---

## Design Direction

The dashboard is a **utility tool**, not a product. It doesn't need to match Tether's "Midnight Editorial" aesthetic. It should be:

- Clean, readable, low visual noise
- Dark theme preferred (Dennis works in dark mode)
- Agent-colored indicators (each agent gets a distinct accent color for quick scanning)
- No gamification, no badges, no streaks — this is a working tool

Suggested agent colors (subtle, not bright):
- Market Researcher: blue-gray
- CFO: amber/gold
- Partnerships Scout: teal

---

## Open Questions for Engineering

1. **Cowork trigger API:** What is the exact API contract for triggering a scheduled task programmatically? Is authentication required? Is there a way to know when a task has finished (webhook or polling)?

2. **"Running" state detection:** How do we know an agent is currently running vs. idle? Options: (a) check if there's a very recent write to their directory, (b) poll the Cowork API for task status. Need to confirm which is viable.

3. **Archived messages:** Agents are supposed to archive processed inbox messages to `agents/{name}/inbox-archive/`. Should the inbox view show archived messages with a toggle, or only show unprocessed ones? Recommend: show all, with a subtle "archived" state for processed ones.

4. **Date collision handling:** If Dennis sends two messages to the same agent on the same day, the filename convention produces a collision. Consider appending a timestamp or a counter suffix (e.g., `-2026-04-14-1.md`, `-2026-04-14-2.md`).

5. **Authentication:** Is any auth needed, or is "it's a local server" sufficient? For v1, assume localhost-only with no auth required.

---

## Milestones

| Milestone | Deliverables |
|---|---|
| **M1 — Read-only** | Reports feed with rendered markdown, inbox viewer, agent sidebar with status |
| **M2 — Compose** | Message composer writing files to inbox, agent detail view |
| **M3 — Real-time** | SSE-based file watcher, browser notifications |
| **M4 — Execution** | "Run now" button wired to Cowork trigger API |
| **M5 — Hiring** | New agent wizard: prompt builder, schedule picker, file scaffolding, COMPANY.md update |

Each milestone is independently shippable and useful. M1 eliminates the folder-diving problem. M2 eliminates manual file writing. M3 makes the dashboard feel live. M4 consolidates everything into one place.

---

## Success Criteria

The dashboard is successful when Dennis can:

1. Open it and immediately see what his agents have produced, without navigating the filesystem
2. Send a task to an agent in under 30 seconds, start to finish
3. Get notified within 30 seconds of a new report or message arriving
4. Trigger any agent from the UI and see it reflected in the agent's status
5. Go an entire week interacting with his agent team without touching the `company/` folder directly
6. Spin up a new agent — name, prompt, schedule, and all — without leaving the dashboard or writing a single file by hand
