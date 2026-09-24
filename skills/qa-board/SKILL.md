---
name: qa-board
description: Drain the board's Agent QA column. For each card, reads the issue's full record and its acceptance criteria, then verifies the shipped change against them by whatever means the criteria actually demand — reading the merged code, running the suite, standing up Docker, driving a browser and logging in. Passes the card to In Review, or fails it with evidence and sends it back to Ready for repair. Only runs on boards that have an Agent QA column. Use when merged work is waiting for automated QA before a human sees it.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Agent, TaskCreate, TaskUpdate, TaskList, TaskOutput
---

# /qa-board — automated QA against acceptance criteria

Verify shipped work before a human ever looks at it. This skill drains the **`agent_qa`**
column: for each card it checks the merged change against the issue's **acceptance
criteria** and returns a verdict — forward to human review, or back to Ready for repair.

> **You are in a fork.** Issues and the board are per project. Resolve the real repo and
> board from where the issues actually live — **never trust the folder name**. See
> `../work-board/references/board.md`, the golden rule.

## The one hard rule

**Only ever pick up cards from the `agent_qa` column.** Never QA something in `ready`,
`active`, or `awaiting_review`. Those belong to other stages, and a card in
`awaiting_review` has already passed here.

## This skill is opt-in per board

`agent_qa` is an **optional** role (`../work-board/references/board.md` Step 4). If the
board has no such column, there is nothing to do: **say so and stop.** Do not fall back to
QA-ing `awaiting_review` — that is the human's queue, and a plain "QA" or "Testing" column
maps to `awaiting_review`, not to `agent_qa`. Never assume a bot owns a human's column.

## Procedure

### 0. Check for write-issues mode (do this FIRST)

`write-issues` is a sticky mode that forbids anything but authoring issues. Its
`UserPromptSubmit` hook injects that instruction into every prompt while active, which
contradicts this skill's job.

```bash
SID="${CLAUDE_CODE_SESSION_ID:-}"
DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
if [ -n "$SID" ] && [ -f "$DIR/.write-issues-mode.$SID" ]; then
  echo "BLOCKED: write-issues mode is active in this session."
fi
```

If blocked, **stop.** Tell the user and offer to toggle `/write-issues` off first. Don't
verify anything, don't move any cards.

### 1. Locate the board (read-only)

Follow `../work-board/references/board.md` Steps 1–4: establish the working repo, discover
the org Projects v2 board, read the real Status field + option IDs, fuzzy-map columns to
roles. Cache the project id, Status field id, and option ids for the session.

**If no column maps to `agent_qa`, stop here** and tell the user this board has no Agent QA
stage.

### 2. List the Agent QA queue (read-only)

Per `../work-board/references/board.md` Step 7, with the `agent_qa` role. **These issues
are closed** — their PR merged and said `Closes #N`. That is expected: filter on the
card's column, never on `state: OPEN`. Show the user the queue before touching anything.

If the queue is empty, say so and stop (or idle, if looping).

### 3. Read each issue in full — body *and* every comment

Read the **full record** per `../work-board/references/issue-context.md`: body, all
comments, timeline, and `closedByPullRequestsReferences`. This is not optional and the body
alone is never enough:

- The **acceptance criteria** may have been amended in a comment. The most recent explicit
  statement wins over the body.
- The **completion comment** (`✅ Done in PR #N`) names what was actually built and any
  manual verification already done.
- A prior **`❌ QA failed`** comment means this is a **re-check** after repair — read what
  failed last time and confirm specifically that it is now fixed, alongside the rest.
- `closedByPullRequestsReferences` names the PR whose diff you are verifying.

### 4. Extract the acceptance criteria

The criteria are the contract (`../write-issues/references/authoring.md`). Pull them from
the record, honouring any amendment in the comments.

**If the issue has no acceptance criteria**, do not invent them and do not guess a pass.
Follow `references/verdict.md` — comment saying QA can't run without criteria, leave the
card in `agent_qa`, and surface it to the user. An issue with no stated bar cannot be
failed fairly, and passing it silently defeats the stage.

### 5. Verify — by whatever means the criteria demand

Per `references/verify.md`. **Method follows the criterion, not convenience.** Reading the
diff is enough for some criteria; others genuinely require standing up the app in Docker,
opening a browser, logging in with real credentials, and exercising the flow end to end. If
a criterion describes user-visible behavior, **drive it** — don't infer it from source.
Capture evidence as you go: command output, test results, screenshots.

Run each card's verification in a **background agent with its own worktree**
(`references/verify.md`), so several cards can be checked at once and the main session
stays free.

### 6. Claim the card while you work

Before verification starts, post a short claim comment on the issue so a concurrent run
(or a human) can see it is being checked. The card **stays in `agent_qa`** throughout — it
only moves on the verdict. See `references/verdict.md`.

### 7. Verdict — pass forward, fail back

Per `references/verdict.md`:

- **Pass** — every criterion met, with evidence. Comment the verdict, then move the card to
  **`awaiting_review`** for human review.
- **Fail** — any criterion not met. Comment which ones failed and **how you know** (the
  evidence, not an opinion), **reopen the issue**, and move the card back to **`ready`**.
  `/work-board` picks it up as a repair (`../work-board/references/qa-bounce.md`).

Never fail a card without evidence, and never pass one on the assumption that the code
looks right.

### 8. Report

Tell the user what passed, what failed and why, what's still being checked, and any
follow-up issues filed (Backlog ones first, with why they need the team). Lead with
outcomes.

## Looping

If the user wants continuous QA, run this on a loop: re-check the `agent_qa` queue each
pass, verify what's new, idle quietly when empty. Use the built-in `/loop` mechanism rather
than busy-waiting; keep the main session responsive. It is safe to leave running because it
only ever consumes from `agent_qa`.

## References
- `references/verify.md` — choosing a verification method, running the app for real, evidence standards.
- `references/verdict.md` — the pass/fail decision, comment formats, and card moves.
- `../work-board/references/board.md` — board discovery, fuzzy column mapping, the move mutation.
- `../work-board/references/issue-context.md` — reading the full record before any judgment.
- `../work-board/references/qa-bounce.md` — what `/work-board` does with a card you fail.
