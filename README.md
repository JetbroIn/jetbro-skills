# 🛠️ Jetbro Skills

> Your GitHub board, but with a crew.

A Claude Code plugin for the way we actually build **phlo** projects: issues on a board,
work in a fork, ship to `main`. Seven skills that between them fill the board, keep it tidy,
do the work, QA it, catch the docs up, tell you how the week went, and turn the session you just had into improvements. The repo is both
the plugin *and* its own marketplace, and it's going to keep growing.

## Meet the crew

| | Skill | Its job | Its personality |
|---|-------|---------|-----------------|
| ✍️ | **`/write-issues`** | Turns a conversation into well-formed issues on the right board, column, and labels. A **sticky mode**: flip it on and the *whole session* is about writing issues until you flip it off. Read-only on your code, adaptive on format (no soul-crushing template). | The one who writes things down so you don't have to. |
| 🧹 | **`/triage`** | Sweeps the open issues, flags dupes, suggests labels, and catches cards sitting in the wrong column (especially anything wrongly in **Ready**). Suggests everything, changes nothing without your say-so. | The tidy one. Slightly judgmental. Means well. |
| 🚀 | **`/work-board`** | Does the actual work. Grabs **Ready** issues, spins up **background worktree agents** to build them in parallel, opens PRs in the house style, gets CI green, self-reviews, merges, comments on what it did, and slides the card to **Agent QA** (or **In Review** if you have no QA column). Can **loop until you say stop**. | The workhorse. Never touches anything that isn't Ready. |
| 🔍 | **`/qa-board`** | Drains the **Agent QA** column. Reads each issue's **acceptance criteria** and actually proves them — reading the merged diff, running the suite, and when the criteria are about what a *user* sees, standing up Docker, opening a browser and driving the flow for real. Passes the card to **In Review**, or fails it with evidence and sends it back to **Ready**. Optional: no Agent QA column, no change. | The sceptic. Won't take your word for it. |
| 📝 | **`/work-prd-update-board`** | Drains the **PRD Update** column. For each issue QA has signed off, it reads the shipped code and the merged PR, rewrites the stale bits of your PRD to match what actually got built, ships a docs-only PR, merges it, and moves the card to **Done**. Only runs on projects whose `CLAUDE.md` says they keep a PRD. | The one who reads the docs nobody else reads. |
| 🔥 | **`/vibe-check`** | Reads the week (commits, PR titles, open issues) and gives you a fast, funny read on the mood. Roasts the *work*, never the people, then celebrates what shipped. Because we're not robots. | The comedian. Runs on Fridays. |
| 🪞 | **`/hansei`** | Reflects on the session you just had and turns it into **concrete self-improvements for this workspace**: a note in CLAUDE.md, a memory, an env key, a script, or a backlog issue. Every suggestion has to cite the moment that caused it, so you get countermeasures, not platitudes. You accept, backlog, or drop each one. | The one who won't let a session end with "that went fine." |

## The pipe

It's an assembly line, and each skill is one station:

```
  ✍️  write-issues   🧹  triage      🚀  work-board    🔍  qa-board      👤  you      📝  work-prd-update-board
   fills the board → keeps it clean → builds it     → proves it       → you sign off → docs catch up (→ Done)
                                     (→ Agent QA)     (→ In Review)
                                          ↑                │
                                          └──── fails it ──┘  back to Ready, with evidence

                                    🔥  vibe-check — tells you how it all felt
                                    🪞  hansei: tells you what to change next time
```

Those bottom two aren't stations, they're the pair that looks back: `/vibe-check` reads the
*week's output* and tells you how it felt, `/hansei` reads *one session's friction* and
tells you what to change. Morale and discipline. Neither one touches a column.

You still control the tap at both ends: nothing gets **built** until *you* drag a card into
**Ready**, and nothing reaches **Done** until *you* review it into **PRD Update**. What
changes with `qa-board` in the middle is what reaches you — cards that already proved they
meet their acceptance criteria. Fill Ready up, walk away, come back to a wall of green
checkmarks and a much shorter review queue.

**Both middle stages are optional, independently.** No **Agent QA** column? `work-board`
hands straight to In Review, exactly as before. No **PRD Update** column (or no PRD declared
in `CLAUDE.md`)? In Review hands straight to a human. Add either column and the matching
skill wakes up; add neither and the pipe is precisely what it always was.

**The QA loop closes itself.** When `qa-board` fails a card it writes *which* criteria
failed and *how it knows*, reopens the issue and sends it back to Ready. `work-board` reads
those comments, spots that this is a repair rather than fresh work, and fixes the specific
gap. If the failure needs a human decision — ambiguous criteria, a contested finding, or a
card that keeps bouncing — it parks it and asks instead of spinning.

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
  map them by meaning (not-ready, ready, active, agent-qa, in-review, prd-update, done)
  instead of hardcoding anything. Call your column "Icebox" if you want; they'll figure it
  out. One deliberate exception: a plain **"QA"** or **"Testing"** column is read as the
  *human* review column, never as Agent QA — a bot doesn't get handed your reviewers' queue
  by accident. Name it "Agent QA" (or AI/Bot/Automated QA) to opt in.
- Every issue lives a **double life**: its GitHub open/closed status *and* its board column
  are two different things. The skills keep them honest so you don't have to.
- The golden rule: **each skill only ever picks up from its own column.** `work-board`
  drains Ready and stops at the handoff; `qa-board` drains Agent QA; `work-prd-update-board`
  drains PRD Update and stops at Done. None of them reaches into another's queue.
- **Every skill reads the whole issue, not just the description.** Body, every comment, and
  the timeline — because scope gets cut in comments, questions get answered in comments, and
  a QA failure *is* a comment. An agent that reads only the description builds the wrong
  thing.
- **Acceptance criteria are the contract.** `write-issues` puts them in every issue that
  gets built, as a checklist of observable outcomes; `qa-board` passes or fails the card on
  exactly those. Vague criteria, worthless QA.
- **PRDs, when a project has one.** `work-prd-update-board` finds your PRD by reading the
  repo's `CLAUDE.md` — say where the requirements live and it'll follow the pointer. No
  mention, no PRD stage, no complaints.

## What an issue looks like

Issues get read by analysts and QA before any developer sees them, so they're written
**functional-first**: the title and the top of the body describe the product problem in
plain language, the acceptance criteria come next, and anything about the code sits at the
bottom under `### Technical notes` where it won't scare anyone off.

```markdown
Client records can be saved with a date of birth of today or a future date, so invalid
records reach the reports and show impossible ages.

Expected: the date of birth must be strictly in the past, rejected at entry otherwise.

## Acceptance criteria
- [ ] A DOB of today is rejected, with an error naming the field
- [ ] A DOB in the future is rejected the same way
- [ ] A DOB in the past still saves
- [ ] The API rejects a future DOB too, not just the form

---
### Technical notes
`ClientForm` checks the DOB's type but sets no upper bound; the API has no check at all.
Files: `src/forms/ClientForm.tsx`, `api/clients.py`
```

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
