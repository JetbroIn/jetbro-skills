# Destinations: where a countermeasure actually lands

A hansei finding is incomplete until it is bound to a real place in this workspace. This
file is the menu, the probe that confirms each option exists, and the convention for
writing to it. Load it when you are binding findings, not before.

## Probe only what the finding needs

Do not sweep every surface. A finding about a slow manual flow needs to know whether the
repo has a `scripts/` convention; it does not need the board. One or two cheap reads per
finding is the target. If a probe is expensive, prefer proposing the destination
conditionally ("if this repo keeps a CLAUDE.md, add it there") over spending the time.

Every probe answers two questions, not one: does this destination exist here, and does it already contain this exact fix? The second question is the one that kills duplicates. A `scripts/` directory existing does not mean your script is missing; look for the script itself. An `.env.example` existing does not mean your key is absent; grep for it.

## The menu

### 1. Repo docs / CLAUDE.md
**Fits:** durable project knowledge the whole team needs, and that an agent should have had
up front. The most common destination by far.
**Probe:** `ls CLAUDE.md docs/ 2>/dev/null`, then grep the file for the topic before
proposing. If it already says this, the finding is dead.
**Write convention:** add to the existing structure, matching the file's heading style.
Never restructure a CLAUDE.md to accommodate one note.

### 2. Claude memory
**Fits:** a fact about the user or this project rather than about the code. Preferences,
working style, standing constraints.
**Probe:** read the memory index at the path given in the session's memory instructions.
Look for an existing file covering the topic.
**Write convention:** follow the memory format the session defines (frontmatter with
`name`, `description`, `metadata.type`, plus an index line). Update an existing memory
rather than creating a near-duplicate.

### 3. Skill / hook / command
**Fits:** a repeatable procedure that was reconstructed by hand this session and will be
again.
**Probe:** list the project's `.claude/` skills and commands. Check whether a skill already
covers it.
**Write convention:** project-scoped only. A **global** skill or the jetbro-skills plugin
itself is aside-only: name the opportunity in one line, do not write to it.

### 4. Env / config / MCP
**Fits:** a missing key or integration the session kept working around by hand.
**Probe:** how does this repo hold config? `ls .env.example .mcp.json .claude/settings.json`
and check what is already wired.
**Write convention:** add the key to `.env.example` (never to a real `.env`, and never a
live secret value), plus a line documenting what it unlocks. Secrets are the user's to
paste in, never yours to invent or copy.

### 5. Script
**Fits:** a slow manual flow worth collapsing into one command.
**Probe:** is there a `scripts/`, `bin/`, `Makefile`, or npm-script convention already?
**Write convention:** follow the convention that exists. Do not introduce a second one.

### 6. Backlog issue
**Fits:** real work, correctly identified, too big to do at the end of a session.
**Probe:** is there a repo and a board? `gh repo view` and, if the board matters, the
discovery procedure in `../../work-board/references/board.md`.
**Write convention:** the issue house style in `../../write-issues/references/authoring.md`:
functional first, technical notes below a `---`. Place it in the not-ready/backlog column,
never straight into Ready. If there is no board, fall back to a plain GitHub issue; if
there is no repo, fall back to a note in the repo or a memory entry.

## Fallback ladder for backlog

When the user says "backlog it", write it wherever the workspace actually permits, in this
order: board issue, plain GitHub issue, a TODO in the repo's existing tracking file, a
Claude memory note. Discover which applies; never assume a board exists.

## Scope tiers

| Tier | Surfaces | What you may do |
|---|---|---|
| **Writable** | The repo; this project's Claude config (`.claude/`, project memory) | Propose and, on approval, change |
| **Aside-only** | Global skills, the jetbro-skills plugin itself | Mention in one line; never write |
| **Out of scope** | Claude Code's behaviour, the model, GitHub's API | Do not propose at all |

The middle tier exists because installing or editing a global skill is a deliberate,
separate decision that outlives this project. Raising it is useful; making it silently is
not.
