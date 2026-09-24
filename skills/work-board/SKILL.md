---
name: work-board
description: Work the project board end to end. Finds Ready issues on the GitHub Projects v2 board, claims each with a comment so parallel sessions don't overlap, dispatches background worktree agents to build them, opens PRs in the team house style, reviews + CI + merges, closes issues, and moves cards to Agent QA (or In Review if the board has no Agent QA column). Can loop until you say stop. Only ever picks up work from the Ready column. Use when you want Claude to develop the outstanding issues on a phlo client project.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Agent, TaskCreate, TaskUpdate, TaskList, TaskOutput
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
to seven roles — `parked`, `ready`, `active`, `agent_qa`, `awaiting_review`, `prd_update`,
`done` — per `references/board.md` Step 4. If the `ready` (or `parked`) role is ambiguous on
a board, **ask the user once**; don't guess. `agent_qa` and `prd_update` are both optional:
`prd_update` this skill never touches, and `agent_qa` only changes **where a finished card
is handed off** — see "After the build" below.

## Procedure

### 0. Check for write-issues mode (do this FIRST)

`write-issues` is a sticky mode that forbids building, and its `UserPromptSubmit` hook
injects that standing instruction into **every** prompt while active. If it is on, that
instruction directly contradicts this skill's job of dispatching build agents. Do not try
to serve both — check and stop:

```bash
SID="${CLAUDE_CODE_SESSION_ID:-}"
DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
if [ -n "$SID" ] && [ -f "$DIR/.write-issues-mode.$SID" ]; then
  echo "BLOCKED: write-issues mode is active in this session."
fi
```

If it reports blocked, **stop here.** Tell the user they're in write-issues mode, that
`/work-board` builds and the two conflict, and offer to toggle write-issues off (`/write-issues`)
before continuing. Don't dispatch anything, don't move any cards.

Also: if a `WRITE-ISSUES MODE IS ACTIVE` block appears in your context but the check above
finds no flag for **this** session, that is a stale or cross-session leak from an older
plugin version. Say so and treat the mode as **off** — don't silently obey it.

### 1. Locate the board (read-only)
Follow `references/board.md` Steps 1–4: establish the working repo, discover the org
Projects v2 board that this fork's issues live on, read the real Status field + option IDs,
and fuzzy-map the columns to roles. Cache the project id, Status field id, and option ids
for the session.

### 2. List the Ready queue (read-only)
Per `references/board.md` Step 7: the open issues whose card is in the `ready` role, from
this repo. Show the user what you found before mutating anything. If nothing is Ready, stop
here (or idle, if looping).

Other engineers may be running `/work-board` on the same board. A Ready card with a **live
`🔨 Claimed` comment** belongs to another session: skip it and tell the user, per
`references/claim.md`.

### 3. Read each candidate issue in full
For every issue you're considering picking up, read its **full record — body, all comments,
and the timeline** per `references/issue-context.md`. The body is the opening statement, not
the spec: scope gets narrowed in comments, approaches get rejected in comments, and the
answer that unparked an issue **is** a comment. Never plan or dispatch off the body alone.

**Check specifically whether the card is a QA bounce.** On a board with an `agent_qa`
column, `/qa-board` moves failed cards back to `ready`, so the Ready queue mixes fresh
issues with repairs — and they are indistinguishable from the body alone. A `❌ QA failed`
comment, a prior `✅ Done in PR #N` comment, or a reopened issue all mean this was already
built once. Handle those per `references/qa-bounce.md`: repair the specific failure rather
than rebuilding, and escalate to a human instead when the failure needs a decision.

### 4. Plan for conflicts
Before doing anything, apply the conflict-risk check in `references/dispatch.md`. Decide
which Ready issues can run in **parallel** worktrees and which must be **serialized**
(same files/area, dependencies, or a shared `framework_version` bump). When unsure, prefer
serial.

### 5. Pick up & dispatch
For each issue you're starting:
- **Claim it first** per `references/claim.md`: re-check it is still in Ready, post the
  `🔨 Claimed by /work-board` comment, and confirm yours is the earliest live claim. If
  another session got there first, back off and move on. Never dispatch without a claim.
- Move its card to the `active` (In Progress) role — `references/board.md` Step 6.
- Spawn a **background** build agent in its **own worktree**
  (`references/dispatch.md`) with a self-contained brief: the resolved repo, the issue's
  **full record from step 3 (body + comments + timeline)**, and the build→ship procedure.
  Tell the agent to **re-read the issue's full record itself** (`references/issue-context.md`)
  before writing code — the brief can go stale, and an agent that works from a summary of
  the body is exactly the failure this pipeline keeps hitting. If it's a QA bounce, the brief
  says so and points at `references/qa-bounce.md`.
  The agent does the coding; this session does **not** build.

### 6. Build → ship (in each background agent)
Each agent follows `references/ship.md`: implement, self-review, get CI green, do a local
check when the change has runtime surface, then — only when confident — merge (PR body says
`Closes #N`, house-style title with the version bump), confirm the issue closed, **leave a
completion comment on the issue** (what was done, plus how only when non-obvious), and move
the card onward — to `agent_qa` if the board has that column, otherwise to `awaiting_review`
(In Review). Merges are serialized across agents (`references/dispatch.md`). Agents **stop
at that handoff** — `/qa-board` or a human takes it from there.

Out-of-scope findings along the way (a nearby bug, a rough edge, something to discuss) become
**follow-up issues** per `references/follow-ups.md`. The column is a judgment call: **backlog**
if the engineering or business team needs to know or talk about it before it is built,
**Ready** if it is a minor improvement or simple fix nobody would notice.

### 7. Questions → ask or park
If a background agent hits a blocking business/technical question, follow
`references/park.md`: relay it to the user in this session (one at a time), keep other work
going, and if it goes unanswered, comment on the issue + move the card to `parked` and stop
that agent. **Never invent product decisions.**

### 8. Report
Keep the user posted in this session: what got picked up, what merged and where it handed
off to (Agent QA or In Review), what was a QA repair rather than fresh work, what's parked
and why, what's still building, any Ready cards skipped because another session claimed
them, and follow-ups filed (backlog ones first, with why they need the team). Lead with
outcomes.

## After the build

This skill's job ends at the handoff column. What happens next depends on the board:

- On a board **with** an `agent_qa` column, the card goes there and `/qa-board` verifies it
  against the issue's acceptance criteria. A pass forwards it to `awaiting_review`; a
  failure comes **back to `ready`** with a `❌ QA failed` comment, which this skill picks up
  again as a repair (`references/qa-bounce.md`), not as fresh work.
- On a board **with** a `prd_update` column, the human reviewer moves the card there after
  In Review, and `/work-prd-update-board` reconciles the project's PRD against what shipped
  before the card reaches Done.
- On a board with **neither**, In Review hands straight to a human as it always has.

`work-board` never moves a card out of `awaiting_review`, never touches the PRD Update
column, and never moves a card out of `agent_qa` — that queue belongs to `/qa-board`.

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
- `references/claim.md`: the pickup claim comment that keeps parallel sessions off the same card.
- `references/follow-ups.md`: filing out-of-scope findings: backlog if the team must discuss it, Ready if nobody would notice.
- `references/issue-context.md` — reading an issue's full record: body + comments + timeline, before any decision.
- `references/dispatch.md` — background worktree agents, conflict-risk check, merge coordination.
- `references/ship.md` — PR house style, review, CI, merge, close, hand off to Agent QA or In Review.
- `references/park.md` — the ask-or-park policy for blocking questions.
- `references/qa-bounce.md` — picking up a card that failed automated QA: repair vs. escalate.
