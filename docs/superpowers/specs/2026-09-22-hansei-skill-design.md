# /hansei: session reflection that ends in a countermeasure

**Date:** 2026-09-22
**Status:** Approved design, ready for implementation planning
**Plugin:** jetbro-skills

## Purpose

`/hansei` is a one-shot skill invoked near the end of any conversation, whatever that
conversation was about: development, issue-writing, QA, debugging, or plain discussion.
It reads the session for friction, works out what in *this workspace* would remove that
friction next time, and proposes a short ranked list of concrete changes. The user then
decides per item whether to do it now, file it as backlog, or drop it.

The name is deliberate. Hansei (反省) is the Toyota practice of stopping at the end of a
cycle to acknowledge what fell short, **even when the cycle succeeded**, where the ritual
is not complete until it produces a countermeasure. Three properties of the practice are
load-bearing in this design:

1. **A clean run is still examined.** Success does not exempt a session from reflection.
2. **No reflection without a countermeasure.** "That was slow" is an incomplete hansei;
   it becomes complete only when bound to a specific change in a specific place.
3. **It pairs with kaizen.** Looking back is half; the improvement that follows is the
   other half. Hence the execute-now branch, not backlog-only.

Register: unsparing but never self-flagellating, and aimed at the process, never at a
person. This mirrors the golden rule `/vibe-check` already carries.

## Where it sits in the plugin

`/hansei` is **not** a board-pipeline skill. It drains no column and has no station in the
assembly line. It sits beside the pipe, as `/vibe-check` does. The two are complements:
`/vibe-check` reads the week's output and says how it felt; `/hansei` reads one session's
friction and says what should change. Morale and discipline respectively.

It is workspace-agnostic: it must work in a phlo client fork, in this plugin repo, or in a
directory with no board and no CLAUDE.md at all. Capability is discovered, never assumed.

## Scope boundary

**In scope:** the repository, and this project's Claude configuration.

**Out of scope, hard:** Claude Code's own behaviour, the model, GitHub's API, or any
system the user cannot change. When the only honest finding is out of scope, `/hansei`
names it in a single line as an aside and moves on. It never pads the list with
suggestions the user is powerless to act on.

**Mentioned but never edited:** global skills and the jetbro-skills plugin itself. Changing
a globally installed skill is a deliberate, separate decision; `/hansei` may raise it as a
one-line aside but must not write to it.

## Evidence rule

Findings come from **this conversation only**. Not from auditing the repository for
general improvements, and not from prior sessions.

> **Every proposed item must name the specific moment in this conversation that produced
> it.** If the skill cannot point at the turn, the item does not ship.

This is the direct analogue of `/vibe-check`'s "never fabricate; every burn must trace to
something real in the data", and it is the single rule that stops the output drifting into
generic advice ("consider adding more tests"), which is the failure mode that trains a user
to stop running the skill.

The skill reads the workspace only to make *those* findings actionable: to learn which
destinations exist, and to check whether the fix is already present. That is capability
discovery, not a source of findings.

**When there is no real friction, the correct output is "clean run, nothing worth
changing."** Padding is a defect.

## Friction signatures

The skill recognises these patterns in what actually happened. This is a list of things to
look for, not a checklist to march through.

| Signature | What it looks like | Typically implies |
|---|---|---|
| **Repetition** | Same file read, same command run, same fact re-derived across turns | Belongs in CLAUDE.md, or in a script |
| **Clarification loop** | The user corrected course, or answered the same class of question twice | Missing context the agent should have had up front |
| **Slow path** | Many turns for something a tool, key, or script would collapse | A script, or a missing integration |
| **Reaching outside** | The session leaned on a system the workspace cannot see | A missing integration, or a note about it |
| **Near-miss** | Something almost went wrong, caught by luck rather than a guardrail | A guardrail: hook, check, or documented rule |

**Ranking is by expected time saved next time**, not by ease of implementation.

## Destination binding

Each surviving finding is bound to a concrete destination. The skill probes **only what
that finding needs**: a finding about a missing script does not require looking for a
board. Intelligent, need-driven probing; not a mechanical sweep of every surface.

| Destination | When it fits | Probe |
|---|---|---|
| **Repo docs / CLAUDE.md** | Durable project knowledge the team needs | Does CLAUDE.md or docs/ exist; does it already say this |
| **Claude memory** | A fact about the user or project, not the code | Check the memory index for a file to update |
| **Skill / hook / command** | A repeatable procedure worth automating | Does a matching skill already exist |
| **Env / config / MCP** | A missing key or integration | How does this repo hold config: .env, settings.json, MCP block |
| **Script** | A slow manual flow worth collapsing | Is there a scripts/ or bin/ convention |
| **Backlog issue** | Real work, too big to do now | Is there a repo and board to file into |

Two rules keep this honest:

1. **Check before proposing.** Check the destination the fix would land in: CLAUDE.md, an
existing memory, an existing script, an already-wired env key, an open issue. If the fix is
already there, the finding is dead, not restated.
2. **Respect the scope boundary above.** Repo and project Claude config are writable;
   global skills and the plugin are aside-only.

## Output format

A ranked list, **5 items maximum**, capped so it stays readable at the end of a long
session. Five is a ceiling, not a target, and there is no floor: one or two real items is a
good hansei, and inventing a third to reach a number is the padding this skill exists to
avoid. Each item has exactly three parts: the friction, the evidence, the countermeasure
with its destination.

```
**2. The Linear board is invisible to this repo** (~10 min/session)
You referenced Linear four times to check business-level status, each time pasting
context in by hand.
→ Add `LINEAR_API_KEY` to `.env.example` and a `## Linear` note in CLAUDE.md mapping
  GitHub issues to Linear items.
```

No essays. If an item needs a paragraph to justify, it is probably two items or none.

## Verdict loop

The user answers **per item**: do it now, backlog it, or drop it. Mixed verdicts in one
pass are the normal case. The skill uses `AskUserQuestion` so this is a few clicks rather
than prose.

- **Do it now**: make the change, then report exactly what was written where.
- **Backlog it**: record it in whatever format the workspace permits. A board issue where
  there is a board, otherwise a TODO in the repo or a memory note. Discovered, not assumed.
- **Drop it**: say nothing further about it.

**Approvals bind to items, not to the session.** Approving item 1 is not licence to also
execute items 2 and 3.

## Files

Following the plugin convention of a short SKILL.md with heavier detail in `references/`:

- `skills/hansei/SKILL.md`: posture, friction signatures, evidence rule, flow, verdict loop
- `skills/hansei/references/destinations.md`: destination table, probes, per-destination
  write conventions, scope boundary
- `README.md`: crew table row and a note that it sits beside the pipe, not in it
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`: version bump

### Frontmatter

`user-invocable: true`. The description must lead with plain-language purpose and carry the
words *reflect*, *retrospective*, and *self-improvement*, because the name itself will not
match how a user naturally phrases the request ("reflect on this session").

`allowed-tools` must include write access (Bash, Read, Edit, Write, Grep, Glob, AskUserQuestion),
because the execute-now branch makes real changes.

The tools therefore cannot enforce the read-only phase, so the skill's instructions must,
and must state it as a hard rule: **`/hansei` makes no change of any kind before the user
has given a verdict on that specific item.** Everything up to the verdict loop is reading
and proposing only.

### README personality line

> The one who won't let a session end with "that went fine."

## Testing

Skill testing here is rehearsal, not unit tests:

1. `claude plugin validate` on the plugin.
2. Dry-run the skill's logic against **this very conversation**, which contains real
   friction (the phlo MCP server failing to connect, among others).
3. Judge the output against the evidence rule: if any item is generic, or any item cannot
   name its originating turn, the skill needs another pass before shipping.

## Explicitly deferred

- **Sticky mode.** A hook-backed variant that accumulates friction across a whole session
  (mirroring `/write-issues`) was considered and deferred. It contradicts the one-shot,
  end-of-conversation premise and is a substantially larger build. Revisit as v2.
- **Cross-session history.** Grepping prior transcripts in `~/.claude/projects` to find
  chronic recurring friction was considered and deferred in favour of conversation-only
  evidence. Revisit once the single-session version proves its signal quality.
