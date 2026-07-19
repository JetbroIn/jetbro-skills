---
name: write-issues
description: Enter (or exit) a sticky issue-authoring mode. While active, every prompt in the session is steered toward understanding the repo (read-only) and creating well-formed GitHub issues on the right project board — correct title/body house style, right project, right column, right labels — never toward development. Run it again to toggle the mode off. Use when you want a working session dedicated to writing issues rather than building them.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

# /write-issues — sticky issue-authoring mode

Toggle a **persistent mode** where the whole session is about **writing issues**, not
building them. Turning it on installs a per-session flag; a `UserPromptSubmit` hook then
re-asserts the mode on every following prompt until you turn it off. This is the fill end
of the pipe — `write-issues` populates the board that `/work-board` later drains.

> **You are in a fork.** Issues and the board are per project. Resolve the real repo and
> board from where the issues actually live — **never trust the folder name**. See the
> shared board reference (`../work-board/references/board.md`) for discovery, fuzzy column
> mapping, and creating/placing items.

## Toggling the mode

The flag file is session-scoped:
`${CLAUDE_PROJECT_DIR}/.claude/.write-issues-mode.${CLAUDE_SESSION_ID}`
(falls back to `.write-issues-mode` without a session id).

**When this skill is invoked, first check whether the flag exists and toggle it:**

Turn ON (flag absent):
```bash
DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"; mkdir -p "$DIR"
FLAG="$DIR/.write-issues-mode${CLAUDE_SESSION_ID:+.$CLAUDE_SESSION_ID}"
touch "$FLAG"
echo "write-issues mode ON — every prompt now authors issues until you toggle off."
```

Turn OFF (flag present, or user says stop/exit write-issues mode):
```bash
DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
FLAG="$DIR/.write-issues-mode${CLAUDE_SESSION_ID:+.$CLAUDE_SESSION_ID}"
rm -f "$FLAG"
echo "write-issues mode OFF — back to normal operation."
```

After turning **on**, confirm it to the user, resolve the target board/repo (board
reference), and then follow `references/authoring.md` for the rest of the session. After
turning **off**, stop steering toward issues.

## What the mode does (see references/authoring.md)

While active:
- **Explore the repo READ-ONLY** to understand the code well enough to write correct,
  specific issues. Never edit code, never build, never open PRs.
- **Draft and refine issues** adaptively — bug, enhancement, change request, or a clear
  one-liner — matching length and structure to what the item actually needs (no fixed
  template), one or many, iterating with the user. See `references/authoring.md`.
- **Create them on the right board** with the right project, the right column (usually the
  `parked`/Todo backlog unless the user says the issue is ready), and the right labels/tags.
- If the user asks to build something, **remind them they're in write-issues mode** and
  offer to exit first — don't silently switch to development.

## References
- `references/authoring.md` — how to explore read-only, the issue house style, and create + place issues.
- `../work-board/references/board.md` — board discovery, fuzzy column mapping, add-to-project + set-column mutations.
