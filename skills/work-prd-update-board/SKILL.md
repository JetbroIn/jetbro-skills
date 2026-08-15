---
name: work-prd-update-board
description: Drain the board's PRD Update column. For each issue a QA has reviewed, reads the shipped code and the merged PR, reconciles the project's PRD against what was actually built (the code is the source of truth), opens a docs-only PR, merges it once CI is green, and moves the card to Done. Only runs on projects whose CLAUDE.md says they keep a PRD. Use when reviewed issues are waiting for their documentation to catch up.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Agent, TaskCreate, TaskUpdate, TaskList, TaskOutput
---

# /work-prd-update-board — keep the PRD honest

Drain the **PRD Update** column: for every issue that has shipped and passed QA review,
bring the project's PRD back in line with the code that actually got built, then move the
card to **Done**.

This is the last automated stage of the pipeline. `write-issues` fills the board,
`work-board` drains Ready and stops at In Review, a human QA reviews and moves the card to
PRD Update, and this skill closes the loop.

> **You are in a fork.** Client work lives in a fork of the framework
> (`enterpriseagentstack/phlo`), and the board + issues are **per project**. Resolve the
> real repo and board from where the issues actually are — **never trust the folder name**.
> See `../work-board/references/board.md`, the golden rule.

## The hard rules

1. **Only ever pick up work from the `prd_update` column.** Never touch Ready, In Review,
   or anything else. A card arrives here because a human put it here.
2. **The code is right; the PRD is what's stale.** You are reconciling the document to
   the shipped implementation, not questioning the implementation. If the code looks
   *wrong*, that is a question for a human (see step 8), not a reason to edit code.
3. **Never edit code in this skill.** The only files that change are PRD/docs files.
4. **No PRD declared → nothing to do.** If the repo's `CLAUDE.md` doesn't indicate the
   project keeps a PRD, this skill is a clean no-op. Say so and stop.

## Procedure

### 0. Check for write-issues mode (do this FIRST)

`write-issues` is a sticky mode that forbids building and opening PRs. This skill opens and
merges PRs, so the two conflict. Check and stop:

```bash
SID="${CLAUDE_CODE_SESSION_ID:-}"
DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
if [ -n "$SID" ] && [ -f "$DIR/.write-issues-mode.$SID" ]; then
  echo "BLOCKED: write-issues mode is active in this session."
fi
```

If it reports blocked, **stop here.** Tell the user they're in write-issues mode, that this
skill ships docs PRs and the two conflict, and offer to toggle write-issues off
(`/write-issues`) first. Don't dispatch anything, don't move any cards.

As in `work-board`: if a `WRITE-ISSUES MODE IS ACTIVE` block appears in your context but the
check above finds no flag for **this** session, that's a stale cross-session leak from an
older plugin version. Say so and treat the mode as **off**.

### 1. Locate the board (read-only)

Follow `../work-board/references/board.md` Steps 1–4: establish the working repo, discover
the board this fork's issues live on, read the real Status field + option IDs, and
fuzzy-map columns to roles. Cache project id, Status field id, and option ids.

**If no column maps to `prd_update`,** this board has no PRD stage. Tell the user which
columns the board does have and stop — do not fall back to another column.

### 2. Find the PRD — from CLAUDE.md

Read the repo's `CLAUDE.md` (root, plus any nested ones in the areas this work touches) and
work out from what it says where the product requirements live. There's no required format:
a `## PRD` section, a line pointing at `docs/prd/`, a sentence in prose — read it the way a
new teammate would and follow the pointer.

Then **verify the path actually exists** before trusting it (`ls`/`Glob`). A CLAUDE.md that
names a moved or deleted file is stale; say so rather than inventing a location.

**If CLAUDE.md says nothing about a PRD, this project has no PRD stage.** Stop, and tell the
user plainly: the board has a PRD Update column but CLAUDE.md doesn't declare a PRD, so
either the PRD needs declaring in CLAUDE.md or those cards should go straight to Done.
Don't go hunting the filesystem for something PRD-shaped and don't guess.

### 3. List the PRD Update queue (read-only)

Read the board's items and keep those whose Status maps to `prd_update`, from this repo.
Unlike the Ready queue these are normally **closed** issues (they shipped already), so don't
filter them out by state. Show the user the list before mutating anything. If it's empty,
stop here (or idle, if looping).

### 4. Read each issue's full record

For every issue in the queue, read its **full record — body, all comments, and the
timeline** per `../work-board/references/issue-context.md`. What the issue ended up being is
usually settled in the comments, and `work-board` leaves a completion comment saying what it
actually built. That comment is your best starting point for what the PRD needs to say.

### 5. Read what actually shipped

The PRD is reconciled against **code**, so find the code:

- The **merged PR(s)** that closed the issue — via the issue's timeline
  (`cross-referenced` / `closed` events) or:
  ```bash
  gh pr list --repo OWNER/REPO --state merged --search "closes #ISSUE_NUMBER" \
    --json number,title,mergedAt,files
  ```
- The **diff** of those PRs (`gh pr diff N --repo OWNER/REPO`) — this is the ground truth
  for what changed.
- The **current state of the touched code**, not just the diff. The diff tells you what
  moved; the file as it stands now tells you what to describe. Later changes may have
  landed on top.

### 6. Plan for conflicts

Docs-only changes conflict far less than code, so **parallel is the default here**.
Serialize only when two issues in the queue would edit the **same PRD file** — then run
them one after another so the second sees the first's merged text. Apply the same judgment
as `../work-board/references/dispatch.md`; when unsure, prefer serial.

### 7. Dispatch a background agent per issue

Spawn a **background** agent in its **own worktree**
(`../work-board/references/dispatch.md`) with a self-contained brief: the resolved repo, the
PRD location from step 2, the issue's full record, the merged PR diff, and
`references/reconcile.md` as the procedure to follow. The agent does the reconciliation and
ships it; this session dispatches, relays questions, and reports.

Each agent follows `references/reconcile.md`: identify the PRD sections this issue's change
affects, compare them against the shipped code, rewrite them to describe what's there, open
a **docs-only PR**, get CI green, **merge it automatically**, comment on the issue, and move
the card to `done`.

### 8. Questions → ask or park

Most drift is mechanical and the agent just fixes it. But when the code contradicts what
looks like a **deliberate product decision** — the PRD says something on purpose and the
implementation went another way — that's not drift to paper over. Follow
`../work-board/references/park.md`: relay the question to the user in this session, keep the
other agents working, and if it goes unanswered, comment on the issue and leave the card in
`prd_update` (**not** `parked` — the work is reviewed and shipped; it's the docs decision
that's waiting). Never invent product intent.

### 9. Report

Keep the user posted: which issues got their PRD updated and what changed, which docs PRs
merged, what's waiting on a question, what's still running. Lead with outcomes. Include the
unrelated drift the agents noticed but deliberately left alone — that list is often the most
useful thing in the report.

## Looping until stop

If the user wants continuous operation, run this as a loop: on each pass, re-check the
`prd_update` queue and dispatch newly-arrived cards, then wait and check again. Because it
**only ever consumes from PRD Update**, it's safe to leave running — QA fills the column,
the loop drains it. Idle quietly when it's empty. Use the built-in `/loop` mechanism for the
interval rather than busy-waiting; keep the main session responsive.

## References
- `references/reconcile.md` — how to compare PRD against code, what to rewrite, and shipping the docs-only PR.
- `../work-board/references/board.md` — board discovery, the six roles, the move mutation.
- `../work-board/references/issue-context.md` — reading an issue's full record before acting.
- `../work-board/references/dispatch.md` — background worktree agents and merge coordination.
- `../work-board/references/park.md` — the ask-or-park policy for blocking questions.
