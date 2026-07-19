# 🛠️ Jetbro Skills

> Your GitHub board, but with a crew.

A Claude Code plugin for the way we actually build **phlo** projects: issues on a board,
work in a fork, ship to `main`. Four skills that between them fill the board, keep it tidy,
do the work, and then tell you how the week went. The repo is both the plugin *and* its own
marketplace, and it's going to keep growing.

## Meet the crew

| | Skill | Its job | Its personality |
|---|-------|---------|-----------------|
| ✍️ | **`/write-issues`** | Turns a conversation into well-formed issues on the right board, column, and labels. A **sticky mode**: flip it on and the *whole session* is about writing issues until you flip it off. Read-only on your code, adaptive on format (no soul-crushing template). | The one who writes things down so you don't have to. |
| 🧹 | **`/triage`** | Sweeps the open issues, flags dupes, suggests labels, and catches cards sitting in the wrong column (especially anything wrongly in **Ready**). Suggests everything, changes nothing without your say-so. | The tidy one. Slightly judgmental. Means well. |
| 🚀 | **`/work-board`** | Does the actual work. Grabs **Ready** issues, spins up **background worktree agents** to build them in parallel, opens PRs in the house style, gets CI green, self-reviews, merges, comments on what it did, and slides the card to **In Review** for a human. Can **loop until you say stop**. | The workhorse. Never touches anything that isn't Ready. |
| 🔥 | **`/vibe-check`** | Reads the week (commits, PR titles, open issues) and gives you a fast, funny read on the mood. Roasts the *work*, never the people, then celebrates what shipped. Because we're not robots. | The comedian. Runs on Fridays. |

## The pipe

It's an assembly line, and each skill is one station:

```
  ✍️  write-issues        🧹  triage           🚀  work-board         🔥  vibe-check
   fills the board  →   keeps it clean   →    drains it (builds)  →   tells you how it felt
```

You control the tap: nothing gets built until *you* drag a card into **Ready**. Fill it up,
walk away, let `work-board` loop through it, come back to a wall of green checkmarks.

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
  map them by meaning (not-ready, ready, active, in-review, done) instead of hardcoding
  anything. Call your column "Icebox" if you want; they'll figure it out.
- Every issue lives a **double life**: its GitHub open/closed status *and* its board column
  are two different things. The skills keep them honest so you don't have to.
- The golden rule: **`work-board` only ever picks up from Ready.** Ready is the tap. You
  hold it.

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
