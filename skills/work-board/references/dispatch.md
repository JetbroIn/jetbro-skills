# Dispatch — background worktree agents & conflict avoidance

The main session is a **dispatcher and the human's conversation channel**. It must stay
free. The actual work of building an issue happens in **background agents running in git
worktrees**, so several issues can progress at once and the user can still talk to Claude.

## Core rules

1. **Do not build in the main session.** When an issue is picked up, spawn a background
   agent (via the Agent tool with `run_in_background: true`) to do the development. The
   dispatcher's job is: pick, dispatch, relay questions, report progress, merge-coordinate.
2. **Isolate each build in a worktree.** Give each background build agent
   `isolation: "worktree"` so concurrent agents never share a working tree. The framework
   auto-cleans worktrees that end up unchanged.
3. **Parallelize only when conflicts are unlikely.** Before fanning out, judge collision
   risk (below). Independent issues → parallel. Overlapping or dependent issues →
   serialize, or run one now and leave the rest in Ready.

## Conflict-risk check (before parallelizing)

Two issues are **likely to conflict** — run them serially — if any of:

- Their titles/bodies point at the **same files, module, or feature area** (e.g. both touch
  auth, or both touch the sidebar).
- One **depends on** the other (mentions "after #N", "blocked by", "builds on").
- Both bump the **`framework_version`** or touch shared manifests — version bumps serialize
  by nature (see ship.md). At most one in-flight version bump at a time.
- They edit the **same migration / schema / config** surface.

When unsure, prefer **serial** — a wrong parallel guess costs a painful merge; a wrong
serial guess only costs a little wall-clock. It is fine to dispatch one issue, let it
merge, then dispatch the next.

Independent issues (different feature areas, no cross-reference, no shared version bump)
are safe to run in parallel worktrees.

## What each background build agent is told to do

Give the agent a self-contained brief:

- The **repo** (resolved per board.md — not the folder name) and the **issue number + full
  text**.
- Instruction to work in its **own worktree/branch** off the default branch.
- The full **build → ship** procedure (see ship.md): implement, verify, open PR in house
  style, ensure CI passes, self-review, and — only when confident — merge, close the issue,
  and move the card to the `awaiting_review` (In Review) column.
- The **ask-or-park** policy (see park.md) for blocking questions: surface up to the
  dispatcher; do not invent business decisions.
- The reminder to **stay in the resolved repo** and never reach back to the parent
  framework's issues.

## Relaying questions

A background agent cannot talk to the user directly — it reports back to the dispatcher.
When an agent surfaces a blocking question, the dispatcher relays it to the user in the
main conversation. Meanwhile **other agents keep working** (the "ask, keep working
elsewhere" policy). If the user doesn't answer in reasonable time, the blocked issue is
parked (park.md) and its agent stops; the rest continue.

## Merge coordination

Even fully-independent branches merge to the same `main` **one at a time**, and CI runs per
merge. The dispatcher serializes the actual merge step across agents so two PRs don't race
the same base. Building is parallel; merging is a single-file line.
