#!/usr/bin/env bash
# UserPromptSubmit hook for the write-issues sticky mode.
# Runs on EVERY prompt. Must be fast and silent when the mode is off.
# When the per-session flag file exists, it re-injects the issue-authoring
# mode instruction so the mode persists across turns until toggled off.

set -euo pipefail

# Session-scoped flag. The session id is ONLY available on stdin for command
# hooks -- there is no CLAUDE_SESSION_ID env var (see Claude Code hooks docs).
# Reading the wrong source used to yield an empty id, which collapsed every
# concurrent session onto one shared project-wide flag and leaked the mode
# across sessions. Fail CLOSED: no id -> no mode.
payload=$(cat 2>/dev/null || true)

sid=""
if [ -n "$payload" ] && command -v jq >/dev/null 2>&1; then
  sid=$(printf '%s' "$payload" | jq -r '.session_id // empty' 2>/dev/null || true)
fi

# No resolvable session id -> stay silent rather than risk a cross-session leak.
[ -n "$sid" ] || exit 0

base="${CLAUDE_PROJECT_DIR:-$PWD}/.claude"
flag="$base/.write-issues-mode.$sid"

# Mode off -> do nothing, exit clean. (Fast path, hit on most prompts.)
[ -f "$flag" ] || exit 0

# Mode on -> inject the standing instruction for this turn.
read -r -d '' CONTEXT <<'EOF' || true
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WRITE-ISSUES MODE IS ACTIVE (sticky — stays on until the user turns it off).

Interpret this and every following prompt as issue-authoring work, NOT development.
Your job in this mode:
  • Understand the current repo/code (READ-ONLY) well enough to write correct issues.
  • Draft and refine well-formed GitHub issues, then create them on the right board
    with the right project, column, and labels/tags.
Hard constraints while this mode is on:
  • Do NOT implement, edit code, open PRs, or start builds. If the user asks to build,
    remind them they are in write-issues mode and offer to exit first.
  • Read-only exploration of the codebase only.
Follow the procedure and house style in the write-issues skill and its references
(references/authoring.md and the shared board plumbing). Confirm the target board/repo
per the board reference — never trust the folder name.
To leave this mode, the user runs /write-issues again (toggle off) or says stop/exit
write-issues mode; when they do, delete the flag file and resume normal operation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

# Emit the UserPromptSubmit additionalContext payload.
if command -v jq >/dev/null 2>&1; then
  jq -n --arg ctx "$CONTEXT" \
    '{hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: $ctx}}'
else
  # Fallback without jq: escape newlines/quotes for a valid JSON string.
  esc=$(printf '%s' "$CONTEXT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
  printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":%s}}\n' "$esc"
fi

exit 0
