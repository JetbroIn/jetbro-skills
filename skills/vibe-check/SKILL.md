---
name: vibe-check
description: A fast, funny vibe check of the week. Reads this week's commit messages, PR titles, and open board-issue titles (and nothing heavier), then writes a short punchy read on the week's energy — roasting the WORK (features that thrashed, not people), pivoting to genuine celebration of what shipped, with a title that IS the week's mood. Affectionate and witty. Use on a Friday, at a wrap-up, or any time the team wants a laugh grounded in what actually happened.
user-invocable: true
allowed-tools: Bash, Read
---

# /vibe-check — the week's mood, roasted and celebrated

Read the least you need, be funny about the truth, keep it short. This is a morale skill,
not a report. Runs read-only and fast — no worktrees, no deep analysis.

## Golden rule of the roast

**Roast the work, never the people.** The jokes land on *features, modules, and
functionality* that thrashed — the thing that got "fixed" five times, the feature that
can't decide what it is, the cluster of issues all complaining about the same number.
**Never** name-and-shame a teammate, never mock someone's competence. Affectionate and
witty, the way you'd tease a project you love. If a joke only works by punching at a person,
cut it.

## 1. Gather the minimum (read-only, fast)

Pull just this week's signal from the current repo (resolve the repo with `gh repo view`;
default window ~7 days):

```bash
# Commit messages this week
git log --since="7 days ago" --pretty=format:"%s" 2>/dev/null | head -80

# PR titles touched this week (merged + open)
gh pr list --state all --search "updated:>=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d)" \
  --json number,title,state --jq '.[] | "\(.state) #\(.number) \(.title)"' 2>/dev/null | head -60

# Open issue titles (board backlog/energy) — current repo
gh issue list --state open --limit 40 --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null
```

If the repo's board is easy to reach, a glance at open board-issue titles adds flavor
(see `../work-board/references/board.md` for discovery) — but don't spend real time on it;
the git + PR + issue titles above are enough. Keep the whole gather under a few seconds.

## 2. Find the patterns worth joking about

Skim for the comedy in the *data*, not for detail:
- **A module/feature that appears again and again** across PRs/commits → the thing in
  therapy. ("Auth got touched in five PRs — it's not shipping features, it's in therapy.")
- **Repeated "fix"/"actually fix"/revert energy** → the emotional-labor award.
- **Clusters of open issues on the same theme** → the numbers have opinions and disagree.
- **A quietly big win buried under the noise** → set up for the celebration turn.
Pick 2–4 sharp observations. Don't list everything; comedy is selection.

## 3. Write the vibe check — short and free-flowing

**Only one fixed element: the title, which IS the mood** — a single line naming the week's
whole energy, as the heading. e.g. `🔥 Vibe Check: The Week Auth Refused to Cooperate`.
That's the payoff; make it land.

**Everything under the title flows** — do NOT use labeled sections ("The roast",
"The celebration"). Write it as one short witty riff: a beat of setup, the roast(s), a
natural turn into the celebration, and a one-line verdict to sign off. It should read like a
person talking, not a form being filled.

**Hard length limits — keep it tiny:**
- **1 to 3 roasts**, aimed at the *work* (never people).
- **1 to 3 celebrations** of what actually shipped.
- The whole thing fits in a short glance — a few lines, not a screenful, never an essay.

Affectionate & witty throughout. When in doubt, cut.

## Example of the whole thing (register + shape, not a template)

> ### 🔥 Vibe Check: The Week Auth Refused to Cooperate
> Controlled chaos with a happy ending. The token-refresh flow got touched in five PRs —
> rotated, single-flighted, grace-windowed, re-single-flighted; it doesn't need another PR,
> it needs a hug. But under all that noise, biometric login shipped and VPS auto-deploy
> landed. Messy middle, strong finish — *we suffered, but we shipped.* **8/10, would
> refactor again.**

Note: title = the mood, then it just *flows* — no section labels, roast melts into
celebration, one verdict, done. That's the whole output. Yours can be even shorter.

## Notes
- If there's genuinely little activity this week, say so with charm ("suspiciously quiet —
  either deep focus or everyone's on vacation") rather than inventing drama.
- Never fabricate. Every burn and every cheer must trace to something real in the data.
- Optional: if the user wants it shareable, offer to render it as a small page — but default
  to just posting it in the chat.
