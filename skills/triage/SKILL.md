---
name: triage
description: Sweep a repo's open issues and tidy the board. Flags likely duplicates, suggests missing or wrong labels, and proposes the correct board column for each issue using the same fuzzy role mapping as work-board. Presents everything as suggestions for your approval before changing anything. Use to keep the board clean — the janitor for issues that write-issues fills and work-board drains.
user-invocable: true
allowed-tools: Bash, Read, Grep
---

# /triage — tidy the board

Sweep the open issues on this project and propose a clean-up: dedupe, label, and correct
columns. **Suggest first, change only on approval** — triage never silently mutates the
board.

> **You are in a fork.** Resolve the real repo and board from where the issues live —
> never trust the folder name. Use `../work-board/references/board.md` for board discovery,
> the fuzzy column-role mapping, and the set-column/label mutations.

## Procedure

### 1. Resolve repo + board (read-only)
Per `../work-board/references/board.md` Steps 1–4: the real repo, the org Projects v2 board
it maps to, the real Status options fuzzy-mapped to roles, and the repo's existing label
set (`gh label list --repo OWNER/REPO`).

### 2. Pull the open issues
```bash
gh issue list --repo OWNER/REPO --state open --limit 100 \
  --json number,title,body,labels,createdAt \
  --jq '.[] | "#\(.number) [\(.labels | map(.name) | join(","))] \(.title)"'
```
Also read each issue's current board column (its project item Status) so you can spot
mis-placed cards.

### 3. Analyze — three passes

**Duplicates / overlaps.** Compare titles and bodies for issues describing the same thing
or heavily overlapping scope. Flag as *likely duplicate of #N* — never assert; the user
decides. Cluster near-dupes together.

**Labels.** For each issue, suggest labels from the repo's **existing** label set based on
what it is (bug / enhancement / area). Flag issues with *no* labels, and labels that look
*wrong* for the content. Don't invent new labels unless the user asks; suggest from what
exists.

**Column placement.** Using the fuzzy role mapping, flag issues whose board column looks
wrong — e.g. an issue clearly not ready sitting in the `ready` role (which `work-board`
would pick up!), or a stale card in `active` with no movement. Be especially careful about
anything wrongly in **Ready**, since that directly feeds automated work.

### 4. Present the plan (no changes yet)
Show a tight, grouped summary:
- **Likely duplicates:** `#12 ~ #34 (both about currency display)` …
- **Missing//wrong labels:** `#40 → suggest 'bug', 'web'` …
- **Column fixes:** `#7 in Ready but underspecified → move to Backlog` …
Lead with anything risky (mis-placed Ready cards) first. Keep it scannable.

### 5. Apply only what's approved
Ask which suggestions to apply. Then, for the approved ones only:
- Labels: `gh issue edit #N --repo OWNER/REPO --add-label "x" --remove-label "y"`
- Column: `updateProjectV2ItemFieldValue` per `../work-board/references/board.md` Step 6.
- Duplicates: comment linking the canonical issue and (if the user agrees) close the dupe —
  `gh issue close #N --repo OWNER/REPO --comment "Duplicate of #M."`. Never close without
  explicit approval.

## Guardrails
- **Suggestions are not actions.** Nothing changes until the user says which to apply.
- **Never close an issue or empty the Ready queue on your own judgment.**
- Don't invent labels or move things around for tidiness' sake beyond what the user approves.
- Read-only on code; triage is about metadata and placement, not implementation.
