# 🛠️ Jetbro Skills

> Your GitHub board, but with a crew.

A Claude Code plugin for the way we actually build **phlo** projects: issues on a board,
work in a fork, ship to `main`. Five skills that between them fill the board, keep it tidy,
do the work, catch the docs up, and then tell you how the week went. The repo is both the
plugin *and* its own marketplace, and it's going to keep growing.

## Meet the crew

| | Skill | Its job | Its personality |
|---|-------|---------|-----------------|
| ✍️ | **`/write-issues`** | Turns a conversation into well-formed issues on the right board, column, and labels. A **sticky mode**: flip it on and the *whole session* is about writing issues until you flip it off. Read-only on your code, adaptive on format (no soul-crushing template). | The one who writes things down so you don't have to. |
| 🧹 | **`/triage`** | Sweeps the open issues, flags dupes, suggests labels, and catches cards sitting in the wrong column (especially anything wrongly in **Ready**). Suggests everything, changes nothing without your say-so. | The tidy one. Slightly judgmental. Means well. |
| 🚀 | **`/work-board`** | Does the actual work. Grabs **Ready** issues, spins up **background worktree agents** to build them in parallel, opens PRs in the house style, gets CI green, self-reviews, merges, comments on what it did, and slides the card to **In Review** for a human. Can **loop until you say stop**. | The workhorse. Never touches anything that isn't Ready. |
| 📝 | **`/work-prd-update-board`** | Drains the **PRD Update** column. For each issue your QA has signed off, it reads the shipped code and the merged PR, rewrites the stale bits of your PRD to match what actually got built, ships a docs-only PR, merges it, and moves the card to **Done**. Only runs on projects whose `CLAUDE.md` says they keep a PRD. | The one who reads the docs nobody else reads. |
| 🔥 | **`/vibe-check`** | Reads the week (commits, PR titles, open issues) and gives you a fast, funny read on the mood. Roasts the *work*, never the people, then celebrates what shipped. Because we're not robots. | The comedian. Runs on Fridays. |

## The pipe

It's an assembly line, and each skill is one station:

```
  ✍️  write-issues     🧹  triage        🚀  work-board      👤  you        📝  work-prd-update-board
   fills the board  → keeps it clean →  builds it (→ In Review) → QA signs off →  docs catch up (→ Done)

                                    🔥  vibe-check — tells you how it all felt
```

You control the tap twice: nothing gets **built** until *you* drag a card into **Ready**, and
nothing reaches **Done** until *you* review it into **PRD Update**. Fill Ready up, walk away,
let `work-board` loop through it, come back to a wall of green checkmarks.

**The PRD stage is optional.** No PRD Update column on your board, or no PRD declared in
`CLAUDE.md`? Then In Review hands straight to a human and the pipe is exactly as it was.

## Get the crew

```
/plugin marketplace add JetbroIn/jetbro-skills
/plugin install jetbro-skills@jetbro-skills
```

Then just type `/` and pick your fighter.

## How the board actually works (the boring-but-important bit)

- **phlo** is our in-house framework (`enterpriseagentstack/phlo`). Client projects are
  **forks**, and all the work happens in the fork, never the parent.
- Boards are **org-level GitHub Projects v2**. A card's column is the single-select
  **Status** field. Column names differ per board, so the skills *read the real names* and
  map them by meaning (not-ready, ready, active, in-review, prd-update, done) instead of
  hardcoding anything. Call your column "Icebox" if you want; they'll figure it out.
- Every issue lives a **double life**: its GitHub open/closed status *and* its board column
  are two different things. The skills keep them honest so you don't have to.
- The golden rule: **each skill only ever picks up from its own column.** `work-board`
  drains Ready and stops at In Review; `work-prd-update-board` drains PRD Update and stops
  at Done. Neither reaches into the other's queue.
- **PRDs, when a project has one.** `work-prd-update-board` finds your PRD by reading the
  repo's `CLAUDE.md` — say where the requirements live and it'll follow the pointer. No
  mention, no PRD stage, no complaints.

<sub>Under the hood, `/write-issues` stays sticky across turns via a `UserPromptSubmit` hook
(`hooks/hooks.json` plus `hooks/write-issues-mode.sh`) that re-asserts the mode while a
per-session flag file exists. Neat trick, mostly invisible.</sub>

## Hacking on it yourself

Try it without installing:

```
claude --plugin-dir /path/to/jetbro-skills
```

Sanity-check before you ship:

```
claude plugin validate /path/to/jetbro-skills
```

New skills are welcome; this collection is meant to grow. Same shape as the others: a
`SKILL.md` that stays short, with heavier detail tucked into `references/`.

## License

MIT. Take it, fork it, make it yours.

---

<sub>Built by the Jetbro team, with a Claude or two. 🤖</sub>
