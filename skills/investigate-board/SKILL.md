---
name: investigate-board
description: Investigate the bugs nobody has proven yet. Picks up open issues labeled needs-investigation from the Backlog and Ready columns, tries to reproduce each one, finds the root cause with a written hypothesis log, and pins a confirmed bug down with a failing test on a pushed branch. Every card leaves with one verdict: confirmed (to Ready with a fix plan), not a bug, actually an enhancement, needs info from the reporter, or duplicate. Use when bugs reported by PMs or clients lack the evidence a developer (or /work-board) needs to fix them.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Agent, TaskCreate, TaskUpdate, TaskList, TaskOutput
---

# /investigate-board: turn a bug report into a proven bug (or prove it isn't one)

Bug reports often arrive as a description of a symptom: no repro steps, no evidence, no
idea where in the code it lives. Building from that wastes a cycle, and sometimes there is
no bug at all. This skill sits **before** the build. It works the issues labeled
**`needs-investigation`** and gives each one a verdict backed by evidence, so that what
reaches Ready is a bug with a known cause and a red test, and what isn't a bug never gets
built.

> **You are in a fork.** Issues and the board are per project. Resolve the real repo and
> board from where the issues actually live, **never trust the folder name**. See
> `../work-board/references/board.md`, the golden rule.

## The one hard rule

**Only ever pick up open issues that carry the `needs-investigation` label and sit in the
`parked` (Backlog) or `ready` column.** The label is the queue, the two columns are its
bounds. Never investigate a card in `active`, `agent_qa`, `awaiting_review` or later: that
work is already someone else's. Never add the label yourself to widen your own queue.

This skill **never fixes the bug**. Its output is evidence, a root cause, a failing test,
and a verdict. The fix is `/work-board`'s job, and `/work-board` skips any card that still
carries the label, so nothing gets built until this skill (or a human) clears it.

## Procedure

### 0. Check for write-issues mode (do this FIRST)

`write-issues` is a sticky mode that forbids anything but authoring issues. Its
`UserPromptSubmit` hook injects that instruction into every prompt while active, which
contradicts this skill's job of running code and pushing test branches.

```bash
SID="${CLAUDE_CODE_SESSION_ID:-}"
DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
if [ -n "$SID" ] && [ -f "$DIR/.write-issues-mode.$SID" ]; then
  echo "BLOCKED: write-issues mode is active in this session."
fi
```

If blocked, **stop.** Tell the user and offer to toggle `/write-issues` off first.

### 1. Locate the board (read-only)

Follow `../work-board/references/board.md` Steps 1–4: establish the working repo, discover
the org Projects v2 board, read the real Status field + option IDs, fuzzy-map columns to
roles. Cache the project id, Status field id, and option ids for the session. Make sure
the label exists (safe to re-run):

```bash
gh label create needs-investigation --repo OWNER/REPO --color FBCA04 \
  --description "Bug report not yet proven: /investigate-board reproduces it and finds the cause" --force
```

### 2. List the queue (read-only)

```bash
gh issue list --repo OWNER/REPO --state open --label needs-investigation --limit 100 \
  --json number,title,author,createdAt
```

Keep the ones whose card is in `parked` or `ready` (board.md Step 5). Show the user the
queue, oldest first, before touching anything. A labeled issue that isn't on the board, or
sits in another column, is listed separately for the user and left alone.

Skip a card whose latest pipeline marker is a live `🔬 Investigating` claim from another
session (`references/verdict.md` section 1). Skip a card whose latest marker is
`❓ Needs info` or `🔍 Investigation inconclusive` unless **a human** has commented since
(not this skill or another bot): it is waiting on someone, and re-investigating the same
evidence produces the same answer. List these waiting cards in the report, and call out any
`❓ Needs info` card with no reply after 7 days so a human can chase the reporter or close
it.

### 3. Read each issue in full: body *and* every comment

Per `../work-board/references/issue-context.md`. For a bug, the comments are often where
the evidence is: a screenshot posted later, "only happens for client X", "started after
Tuesday's deploy". A **previous `🔬` verdict comment** means this is a re-run: carry its
hypothesis log forward and start from what it left open, rather than re-checking what it
already ruled out.

### 4. Claim, then investigate in a background worktree agent

Post the claim comment (`references/verdict.md` section 1); the card **does not move**
while it's being investigated. Then spawn a **background** agent per card with
`isolation: "worktree"`, as `/qa-board` does
(`../qa-board/references/verify.md`, "Run each card in a background worktree agent").
Brief it with the resolved repo, the issue's full record, any previous hypothesis log, and
`references/investigate.md`, and tell it to re-read the record itself before starting.
Several cards can run in parallel; serialize ones that would bring up the same ports or
containers.

The agent follows `references/investigate.md`: pin down the claim, reproduce it, keep a
**hypothesis log**, trace the cause, and for a confirmed bug **write a failing test and
push it on a branch**. It returns its evidence and a proposed verdict; this session posts
the verdict and moves the card.

### 5. Verdict: exactly one per card

Per `references/verdict.md`. Every investigated card leaves with one of:

| Verdict | Means | What happens |
|---|---|---|
| ✅ **Confirmed** | Reproduced, cause found, failing test pushed | RCA comment, label removed, card to `ready` (or stays in `parked` if the fix needs a team decision) |
| 🚫 **Not a bug** | Works as designed, environment/data issue, or already fixed on main | Evidence comment, label removed, card to `parked`, closed as not planned **after the user confirms** |
| 💡 **Enhancement** | The code does what it was built to do; the report asks for something else | Comment, relabel to the repo's enhancement label, card to `parked` |
| ❓ **Needs info** | Can't reproduce or narrow down without facts only the reporter has (no repro steps, no account, no time) | Specific questions, @mentioning the reporter; label stays |
| 🔁 **Duplicate** | Same root cause as another open issue | Link it, label removed, card to `parked`, closed as duplicate **after the user confirms** |
| 🔍 **Inconclusive** | Enough to go on, investigated, real leads, but no proof yet | Hypothesis log posted; label stays; surfaced to the user |

Never post a verdict without the evidence for it. "I couldn't reproduce it" alone is never
a verdict; it is the start of a needs-info or inconclusive comment that says exactly what
was tried.

### 6. Report

Tell the user: what was confirmed (with the root cause in one line each and the test
branch), what is waiting on their confirmation to close, which reporters were asked for
info and what about, what is inconclusive and the leading hypothesis, and anything skipped.
Lead with outcomes.

## Looping

On a loop, each pass re-lists the labeled queue and picks up what's new, including
needs-info cards that got a reply. Idle quietly when the queue is empty. Use the built-in
`/loop` mechanism; keep the main session responsive. Closing confirmations queue up for the
user rather than blocking the loop.

## References
- `references/investigate.md`: reproducing, the hypothesis log, finding the cause, the failing test.
- `references/verdict.md`: the claim, the verdict comments, labels, closes, and card moves.
- `../qa-board/references/verify.md`: running the app for real, credentials, background worktree agents.
- `../work-board/references/board.md`: board discovery, fuzzy column mapping, the move mutation.
- `../work-board/references/issue-context.md`: reading the full record before any judgment.
- `../work-board/references/follow-ups.md`: the Backlog-or-Ready test reused for confirmed bugs.
