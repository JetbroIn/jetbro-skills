---
name: work-board
description: Work the project board end to end. Finds Ready issues on the GitHub Projects v2 board, dispatches background worktree agents to build them, opens PRs in the team house style, reviews + CI + merges, closes issues, and moves cards to In Review. Can loop until you say stop. Only ever picks up work from the Ready column. Use when you want Claude to develop the outstanding issues on a phlo client project.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Agent, Task, TaskCreate, TaskUpdate
---

# /work-board — drive the issue board

Work the outstanding issues on this project's board, from **Ready** all the way to **In
Review**, running the actual builds in **background worktree agents** while this session
stays free to talk to the user.

> **You are in a fork.** Client work lives in a fork of the framework
> (`enterpriseagentstack/phlo`), and the board + issues are **per project**. Resolve the
> real repo and board from where the issues actually are — **never trust the folder name**
> (a `phlo-goldmine` checkout was seen pointing at `enterpriseagentstack/phlo`). See
> `references/board.md`, the golden rule.

## The one hard rule

**Only ever pick up work from the `Ready` column.** Never start Backlog/Todo, never start
anything else on your own. The user controls the tap by moving cards into Ready. If Ready
is empty, there is nothing to do — say so and (if looping) idle.

## Roles map, not column names

Column names differ per board. Read the board's real Status options and map them by meaning
to five roles — `parked`, `ready`, `active`, `awaiting_review`, `done` — per
`references/board.md` Step 4. If the `ready` (or `parked`) role is ambiguous on a board,
**ask the user once**; don't guess.

## Procedure

### 1. Locate the board (read-only)
Follow `references/board.md` Steps 1–4: establish the working repo, discover the org
Projects v2 board that this fork's issues live on, read the real Status field + option IDs,
and fuzzy-map the columns to roles. Cache the project id, Status field id, and option ids
for the session.

### 2. List the Ready queue (read-only)
Per `references/board.md` Step 7: the open issues whose card is in the `ready` role, from
this repo. Show the user what you found before mutating anything. If nothing is Ready, stop
here (or idle, if looping).

### 3. Plan for conflicts
Before doing anything, apply the conflict-risk check in `references/dispatch.md`. Decide
which Ready issues can run in **parallel** worktrees and which must be **serialized**
(same files/area, dependencies, or a shared `framework_version` bump). When unsure, prefer
serial.

### 4. Pick up & dispatch
For each issue you're starting:
- Move its card to the `active` (In Progress) role — `references/board.md` Step 6.
- Spawn a **background** build agent in its **own worktree**
  (`references/dispatch.md`) with a self-contained brief: the resolved repo, the full
  issue text, and the build→ship procedure. The agent does the coding; this session does
  **not** build.

### 5. Build → ship (in each background agent)
Each agent follows `references/ship.md`: implement, self-review, get CI green, do a local
check when the change has runtime surface, then — only when confident — merge (PR body says
`Closes #N`, house-style title with the version bump), confirm the issue closed, **leave a
completion comment on the issue** (what was done, plus how only when non-obvious), and move
the card to `awaiting_review` (In Review). Merges are serialized across agents
(`references/dispatch.md`). Agents **stop at In Review** — a human takes it to Done or
reopens it.

### 6. Questions → ask or park
If a background agent hits a blocking business/technical question, follow
`references/park.md`: relay it to the user in this session (one at a time), keep other work
going, and if it goes unanswered, comment on the issue + move the card to `parked` and stop
that agent. **Never invent product decisions.**

### 7. Report
Keep the user posted in this session: what got picked up, what merged and moved to In
Review, what's parked and why, what's still building. Lead with outcomes.

## Looping until stop

If the user wants continuous operation ("keep building until I say stop"), run this as a
loop: on each pass, re-check the `ready` queue and dispatch newly-Ready issues (respecting
conflict risk and in-flight work), then wait and check again. Because the loop **only ever
consumes from Ready**, it is safe to leave running — the user fills Ready, the loop drains
it. Idle quietly when Ready is empty. Stop when the user says stop.

Use the built-in `/loop` mechanism for the interval rather than busy-waiting. Keep the main
session responsive throughout — the loop is a heartbeat, not a blocker.

## References
- `references/board.md` — Projects v2 discovery, fuzzy column mapping, the move mutation (verified GraphQL).
- `references/dispatch.md` — background worktree agents, conflict-risk check, merge coordination.
- `references/ship.md` — PR house style, review, CI, merge, close, move to In Review.
- `references/park.md` — the ask-or-park policy for blocking questions.
