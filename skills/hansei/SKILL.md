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
- **Already fixed?** Check the destination the fix would land in, not just CLAUDE.md: a rule
  already in Claude memory, a script that already does this, an env key already wired, an open
  issue already filed. If it is already there, the finding is dead. Drop it, do not restate it.
  Proposing a duplicate is worse than proposing nothing.
- **In scope?** The repo and this project's Claude config are fair game. Global skills and
  the jetbro-skills plugin itself are **aside-only**: mention in one line, never write.
  Claude Code's own behaviour, the model, and GitHub's API are **out of scope entirely**,
  the user cannot change them, so proposing it wastes the list.

## 3. Present what you actually found, ranked (5 items maximum)

Five is a ceiling, not a target, and there is no floor. Two real items is a good hansei. One is
a good hansei. Never invent an item to reach a number: an item you would not have raised on its
own merits is padding, and padding is the whole failure mode this skill exists to avoid.

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

- **Do it now** → make the change, then report exactly what was written where. If the
  destination turns out not to exist (no CLAUDE.md, no `scripts/` convention, no board),
  stop and ask before creating it: the approval was for the note, not for a new file in
  someone's repo root.
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
