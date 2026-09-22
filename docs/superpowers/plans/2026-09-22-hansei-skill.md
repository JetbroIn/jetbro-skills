# /hansei Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/hansei`, a one-shot skill that reads a finished conversation for friction and proposes concrete, destination-bound countermeasures the user accepts or rejects per item.

**Architecture:** Two Markdown files in the established plugin shape: a short `SKILL.md` carrying posture, friction signatures, the evidence rule, and the verdict loop; plus `references/destinations.md` carrying the destination table, probes, and per-destination write conventions. No code, no hook, no state. The skill is invoked explicitly and runs once. Supporting edits to `README.md` and the two plugin manifests make it discoverable and installable.

**Tech Stack:** Markdown with YAML frontmatter; `claude plugin validate` for structural verification; `gh` and shell reads at runtime (not at build time).

**Spec:** `docs/superpowers/specs/2026-09-22-hansei-skill-design.md`

## Global Constraints

These apply to every task. Copied verbatim from the spec and from the user's standing rules.

- **No em-dashes in any file this plan creates or edits.** Use commas, colons, or parentheses. Verify with `grep -c '—'` returning `0`. This is a standing user rule, not a style preference.
- **Skill name is `hansei`**, directory `skills/hansei/`, invoked as `/hansei`.
- **Evidence rule:** every proposed item must name the specific moment in the conversation that produced it; an item that cannot cite its turn does not ship.
- **Findings come from the conversation only**, never from auditing the repo for general improvements. Reading the workspace is capability discovery, not a source of findings.
- **No writes of any kind before the user gives a verdict on that specific item.**
- **Item cap: 3 to 5.** When there is no real friction the output is "clean run, nothing worth changing"; padding is a defect.
- **Scope tiers:** writable = the repo and this project's Claude config; aside-only = global skills and the jetbro-skills plugin itself; hard out-of-scope = Claude Code, the model, GitHub's API.
- **Register:** unsparing but never self-flagellating, aimed at the process and never at a person.
- **House style:** short `SKILL.md`, heavier detail in `references/`. Match the voice of `skills/vibe-check/SKILL.md` and `skills/triage/SKILL.md`.

---

## File Structure

| File | Responsibility |
|---|---|
| `skills/hansei/SKILL.md` | Create. Posture and register, the friction signatures, the evidence rule, the flow, the output format, the verdict loop. The whole skill as an agent experiences it. |
| `skills/hansei/references/destinations.md` | Create. The destination table, the need-driven probe for each, the write convention for each, and the scope tiers. Loaded only when binding a finding to a destination. |
| `README.md` | Modify. One crew-table row, one line in the pipe diagram area noting it sits beside the pipe, and a count fix ("Six skills" becomes "Seven skills"). |
| `.claude-plugin/plugin.json` | Modify. Version bump 1.4.0 to 1.5.0. |
| `.claude-plugin/marketplace.json` | Modify. Version bump (currently stale at 1.2.0) to 1.5.0. |

Task order is dependency order: the reference file defines the destinations that `SKILL.md` points at, so it lands first. Tasks 1 and 2 each end in a committable, independently reviewable file.

---

### Task 1: The destinations reference

**Files:**
- Create: `skills/hansei/references/destinations.md`
- Verify: `grep`, `claude plugin validate`

**Interfaces:**
- Consumes: nothing. First task.
- Produces: the file path `references/destinations.md`, which `SKILL.md` (Task 2) references by exactly that relative path. The six destination names defined here (`Repo docs / CLAUDE.md`, `Claude memory`, `Skill / hook / command`, `Env / config / MCP`, `Script`, `Backlog issue`) are quoted verbatim in Task 2; they must match character for character.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p skills/hansei/references
```

- [ ] **Step 2: Write the reference file**

Write `skills/hansei/references/destinations.md` with exactly this content:

```markdown
# Destinations: where a countermeasure actually lands

A hansei finding is incomplete until it is bound to a real place in this workspace. This
file is the menu, the probe that confirms each option exists, and the convention for
writing to it. Load it when you are binding findings, not before.

## Probe only what the finding needs

Do not sweep every surface. A finding about a slow manual flow needs to know whether the
repo has a `scripts/` convention; it does not need the board. One or two cheap reads per
finding is the target. If a probe is expensive, prefer proposing the destination
conditionally ("if this repo keeps a CLAUDE.md, add it there") over spending the time.

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
```

- [ ] **Step 3: Verify the constraints hold**

```bash
grep -c '—' skills/hansei/references/destinations.md
```
Expected: `0`. Any other number means em-dashes slipped in; replace them with colons or commas before continuing.

```bash
grep -c 'aside-only' skills/hansei/references/destinations.md
```
Expected: `2` or more (the scope tier must appear in both the skill/hook entry and the tier table).

- [ ] **Step 4: Verify the cross-references resolve**

```bash
ls skills/work-board/references/board.md skills/write-issues/references/authoring.md
```
Expected: both paths listed, no "No such file". These are the two files the reference points at with `../../`; if either is missing, the relative paths in Step 2 are wrong and must be corrected.

- [ ] **Step 5: Commit**

```bash
git add skills/hansei/references/destinations.md
git commit -m "feat(hansei): add the destinations reference

The menu of places a countermeasure can land, the cheap probe that
confirms each exists, and the write convention for each. Encodes the
scope tiers: repo and project config are writable, global skills and
the plugin itself are aside-only, Claude Code is out of scope.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The skill itself

**Files:**
- Create: `skills/hansei/SKILL.md`
- Test: `claude plugin validate .`

**Interfaces:**
- Consumes: `references/destinations.md` from Task 1, by that exact relative path, and the six destination names defined there.
- Produces: the `/hansei` command. Task 3's README row must match this file's `description` in substance.

- [ ] **Step 1: Write the skill**

Write `skills/hansei/SKILL.md` with exactly this content:

```markdown
---
name: hansei
description: Reflect on the session that just happened and turn it into concrete self-improvements for this workspace. Reads the conversation for friction (what repeated, what needed clarifying, what took far too many turns), then proposes a short ranked list of changes bound to real destinations: CLAUDE.md, project docs, Claude memory, a script, an env key, or a backlog issue. You accept, backlog, or drop each one. A retrospective that ends in a countermeasure, not a feeling. Use at the end of any conversation, whatever it was about.
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write, AskUserQuestion
---

# /hansei: what should this session change?

Hansei (反省) is the Toyota habit of stopping at the end of a cycle and asking honestly what
fell short, **even when the cycle succeeded**. The ritual is not finished until it produces a
countermeasure. That is this skill: read the session that just happened, find the friction
that actually cost time, and propose specific changes to *this workspace* so the next
session does not pay it again.

Then the kaizen half: the user picks, per item, whether to do it now, file it, or drop it.

**Register: unsparing, never self-flagellating.** Aim at the process, never at a person,
neither the user nor yourself. Same golden rule `/vibe-check` runs on.

## The one rule that matters

> **Every item must name the specific moment in this conversation that produced it.**
> If you cannot point at the turn, the item does not ship.

Findings come from **this conversation**, not from auditing the repo for things that could
be better in general. You will read parts of the workspace, but only to make *these*
findings actionable: to learn which destinations exist, and to check whether the fix is
already there. That is capability discovery, not a source of findings.

**If the session genuinely had no friction, say so: "Clean run, nothing worth changing."**
Padding the list with generic advice ("consider adding more tests") is the failure mode
that teaches the user to stop running this skill. Three real items beat five plausible ones.

## 1. Read the session for friction

Look back over what actually happened. These are patterns to recognise, not a checklist to
work through:

- **Repetition**: the same file read, the same command re-run, the same fact re-derived
  across turns. Something belongs in CLAUDE.md or a script.
- **Clarification loops**: the user had to correct course, or answer the same class of
  question twice. Context that should have been available up front was not.
- **Slow paths**: many turns spent on something a key, tool, or script would have
  collapsed into one.
- **Reaching outside**: the session leaned on a system this workspace cannot see, and
  the gap was bridged by hand every time.
- **Near-misses**: something almost went wrong and was caught by luck rather than by a
  guardrail.

Be honest about your own contribution. If you misread the repo and burned four turns on it,
that is a finding, and the countermeasure is usually a note that would have prevented it.

**Rank by time saved next time**, not by how easy the fix is.

## 2. Bind each finding to a real destination

A finding without a destination is not a countermeasure. For each one that survives, work
out where the fix actually lives, and **probe only what that finding needs** (a missing
script does not require looking for a board).

The menu, the probes, and the write conventions are in `references/destinations.md`:
repo docs / CLAUDE.md, Claude memory, a skill/hook/command, env/config/MCP, a script, or a
backlog issue.

Two checks before an item ships:
- **Already fixed?** If CLAUDE.md already documents it, the finding is dead. Drop it, do
  not restate it.
- **In scope?** The repo and this project's Claude config are fair game. Global skills and
  the jetbro-skills plugin itself are **aside-only**: mention in one line, never write.
  Claude Code's own behaviour, the model, and GitHub's API are **out of scope entirely**,
  the user cannot change them, so proposing it wastes the list.

## 3. Present 3 to 5 items, ranked

Each item is three parts and no more: the friction, the evidence from this session, the
countermeasure with its destination.

> **2. The Linear board is invisible to this repo** (~10 min/session)
> You referenced Linear four times to check business-level status, pasting the context in
> by hand each time.
> → Add `LINEAR_API_KEY` to `.env.example` and a `## Linear` note in CLAUDE.md mapping
> GitHub issues to Linear items.

No essays. If an item needs a paragraph to justify itself, it is two items or none.

## 4. Get a verdict per item, then act

**Change nothing until the user has ruled on that specific item.** Everything above this
point is reading and proposing.

Ask with `AskUserQuestion` so it is a few clicks, not an essay. Per item:

- **Do it now** → make the change, then report exactly what was written where.
- **Backlog it** → record it in whatever format this workspace permits (see the fallback
  ladder in the reference: board issue, plain issue, repo TODO, memory note).
- **Drop it** → say nothing further about it.

Mixed verdicts across items are the normal case. **An approval binds to its item only**:
a yes on item 1 is not permission to do items 2 and 3.

Finish with one line naming what changed and what was filed. Then stop; hansei does not
turn into a work session.

## References
- `references/destinations.md`: the destination menu, the probe for each, the write
  conventions, and the scope tiers.
```

- [ ] **Step 2: Verify the frontmatter parses and the skill is discovered**

```bash
claude plugin validate .
```
Expected: validation passes and reports the plugin's skills. If `hansei` is absent or the frontmatter errors, fix before continuing. (If the command is unavailable in this environment, fall back to `head -8 skills/hansei/SKILL.md` and confirm the YAML block opens and closes with `---` and carries `name`, `description`, `user-invocable`, `allowed-tools`.)

- [ ] **Step 3: Verify the global constraints**

```bash
grep -c '—' skills/hansei/SKILL.md
```
Expected: `0`. The content in Step 1 is already em-dash free; if the count is non-zero, one was introduced during transcription. Replace it with a colon, comma, or parenthesis and re-run.

```bash
grep -n 'references/destinations.md' skills/hansei/SKILL.md && ls skills/hansei/references/destinations.md
```
Expected: the reference is mentioned at least twice and the file exists at that path.

- [ ] **Step 4: Rehearse the skill against a real transcript**

This is the real test. Read `skills/hansei/SKILL.md` as though invoked, and apply it to **the conversation that produced this plan**, which contains genuine friction (the `phlo` MCP server failed to connect; the em-dash rule was violated in a written artifact and had to be corrected; the skill name changed late, after a spec was already drafted).

Judge the output against three questions:
1. Does every item cite a specific moment? If any item is generic, the friction signatures in section 1 need sharpening.
2. Is every item bound to a destination that exists? If not, section 2 or the reference needs work.
3. Would the user act on at least one? If not, the ranking rule is not earning its place.

Fix the skill inline if any answer disappoints. A skill that produces bland output on a transcript this eventful will produce bland output everywhere.

- [ ] **Step 5: Commit**

```bash
git add skills/hansei/SKILL.md
git commit -m "feat(hansei): add the /hansei session-reflection skill

Reads the finished conversation for friction, binds each finding to a
real destination in this workspace, and proposes 3 to 5 ranked items the
user accepts, backlogs, or drops one at a time.

The evidence rule is the spine: an item that cannot name the turn that
produced it does not ship, and a frictionless session gets 'clean run'
rather than padding.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Publish it (README and manifests)

**Files:**
- Modify: `README.md`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: the skill name `hansei` and its description from Task 2.
- Produces: nothing downstream. Final task.

- [ ] **Step 1: Add the crew-table row**

In `README.md`, the crew table's last row is the `/vibe-check` row. Add this row directly after it, keeping the four-column shape (`icon | skill | job | personality`):

```markdown
| 🪞 | **`/hansei`** | Reflects on the session you just had and turns it into **concrete self-improvements for this workspace**: a note in CLAUDE.md, a memory, an env key, a script, or a backlog issue. Every suggestion has to cite the moment that caused it, so you get countermeasures, not platitudes. You accept, backlog, or drop each one. | The one who won't let a session end with "that went fine." |
```

- [ ] **Step 2: Fix the skill count and place it beside the pipe**

The README opens by saying the plugin has "Six skills". Update the count:

```bash
grep -n 'Six skills' README.md
```

Replace `Six skills` with `Seven skills` and extend that sentence's list so the new skill is accounted for: after "tell you how the week went", add ", and turn the session you just had into improvements".

Then place it beside the pipe. In the ASCII diagram in the "The pipe" section, `vibe-check` already sits on its own line below the assembly line:

```
                                    🔥  vibe-check — tells you how it all felt
```

Add `hansei` directly beneath that line, inside the same code fence:

```
                                    🪞  hansei: tells you what to change next time
```

Then, immediately **after** the closing fence of that diagram (the ` ``` ` line that precedes the paragraph beginning "You still control the tap at both ends"), insert this new paragraph followed by a blank line:

```markdown
Those bottom two aren't stations, they're the pair that looks back: `/vibe-check` reads the
*week's output* and tells you how it felt, `/hansei` reads *one session's friction* and
tells you what to change. Morale and discipline. Neither one touches a column.
```

- [ ] **Step 3: Verify the README edits**

```bash
grep -c 'hansei' README.md
```
Expected: `3` or more. Three mentions are added by Step 1 and Step 2: the crew-table row, the diagram line, and the looks-back paragraph.

```bash
grep -n 'Six skills' README.md
```
Expected: no output. If "Six skills" still appears, Step 2 did not apply.

- [ ] **Step 4: Bump both manifests**

```bash
sed -i '' 's/"version": "1.4.0"/"version": "1.5.0"/' .claude-plugin/plugin.json
sed -i '' 's/"version": "1.2.0"/"version": "1.5.0"/' .claude-plugin/marketplace.json
grep -n '"version"' .claude-plugin/plugin.json .claude-plugin/marketplace.json
```
Expected: both files report `1.5.0`. Note the marketplace version was stale at `1.2.0`; bringing it to `1.5.0` intentionally resyncs it with the plugin manifest.

- [ ] **Step 5: Validate the whole plugin**

```bash
claude plugin validate .
```
Expected: passes, with seven skills listed including `hansei`. Fix any error before committing.

- [ ] **Step 6: Verify no em-dashes were introduced**

```bash
git diff --cached -- README.md | grep -c '—' || echo 0
```
Run after staging in Step 7, or run `grep -c '—' README.md` and compare against the pre-edit count. Expected: the edits added none. (The README already contains em-dashes from earlier work; this plan does not require rewriting existing prose, only that new lines add none.)

- [ ] **Step 7: Commit**

```bash
git add README.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "feat(hansei): publish the skill: README row and v1.5.0

Adds /hansei to the crew table, notes that it sits beside the pipe
alongside vibe-check (week's mood vs session's friction), and bumps both
manifests. The marketplace version was stale at 1.2.0; it is resynced
to 1.5.0 to match the plugin manifest.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Deferred (do not build)

Recorded so they are not silently rediscovered mid-implementation:

- **Sticky mode.** A hook-backed variant accumulating friction across a session, mirroring `/write-issues`. Contradicts the one-shot premise and is a much larger build. Revisit as v2.
- **Cross-session history.** Grepping prior transcripts in `~/.claude/projects` for chronic recurring friction. Deferred until the single-session version proves its signal quality.
