# Reconcile — bring the PRD in line with the shipped code

This is what a background PRD agent does for one issue, once the code has already shipped
and a QA has moved the card to PRD Update. The goal: the PRD should describe the product as
it actually is, for the part of it this issue touched.

**The governing principle: the code is right.** The implementation shipped, CI passed, and a
human reviewed it. Where the PRD and the code disagree, the PRD is what's out of date.

## 1. Establish the three inputs

Before writing anything, have all three in hand:

1. **What the issue asked for** — body, comments, timeline, and especially the completion
   comment `work-board` left saying what it built.
2. **What actually shipped** — the merged PR diff, *and* the current state of the touched
   files (later work may have landed on top of that diff).
3. **What the PRD currently claims** — the sections of the PRD covering this area.

If any of the three is missing or unreadable, stop and report it rather than guessing. A
PRD rewritten from two-thirds of the picture is worse than one left stale.

## 2. Scope: only what this issue touched

**Do not reconcile the whole document.** Find the PRD sections that this issue's change
actually affects, and confine edits to those. Scope is usually obvious from the diff: the
feature area the code touched maps to the PRD section describing that feature.

Judgment call: a section is in scope if the shipped change makes something it says
**untrue or incomplete**. A section merely *near* the change, or that mentions the same
feature without contradicting it, is out of scope — leave it alone.

## 3. Compare, and classify each disagreement

Read the in-scope PRD text against the shipped code. Each mismatch falls into one of three
buckets, and they're handled differently:

**Drift — fix it.** The PRD describes an earlier version of this behaviour, or doesn't
mention behaviour the code now has. Renamed fields, changed defaults, an added step in a
flow, a limit that moved, a screen that gained a control. Rewrite the PRD to describe the
code. This is the common case and the whole point of the stage.

**Absence — fill it.** The issue added something the PRD doesn't cover at all. Write the
new material in the voice and structure of the surrounding document.

**Contradiction — ask, don't paper over.** The PRD states something that reads as a
*deliberate product decision*, and the code did something materially different. Not "the
doc is out of date" but "somebody decided X and we shipped Y." Examples: the PRD says a
flow requires explicit user confirmation and the code does it silently; the PRD specifies
a business rule (a fee, a threshold, an eligibility condition) and the code uses another.

For a contradiction, **do not edit that section**. Surface it as a blocking question per
`../../work-board/references/park.md` — the dispatcher relays it to the user. Keep the
rest of the reconciliation going; one contradiction doesn't block the other sections. If
it goes unanswered, comment the question on the issue and leave the card in `prd_update`.

When you can't tell whether something is drift or a deliberate decision, **treat it as a
contradiction and ask.** The cost of asking is one question; the cost of quietly rewriting
a real product decision is a PRD that now lies with confidence.

## 4. Note unrelated drift — don't fix it

You will notice PRD statements that are stale for reasons that have nothing to do with this
issue. **Leave them.** Fixing them silently makes the docs PR unreviewable and mixes
unrelated judgment into a scoped change.

Instead, list them in the PR body under a `## Drift noticed, not fixed` heading — file,
section, and one line on what looks stale. That list is the seed for the next issue.

## 5. Write like the document, not like a changelog

The PRD is a description of the product as it is. It is **not** a history of changes.

- Write in the document's existing voice, tense, and structure. Match its heading depth,
  its level of detail, whether it uses tables or prose.
- **Never** write "changed to", "now supports", "as of #64", "previously the system…".
  Someone reading the PRD fresh should not be able to tell which sentences you touched.
- Don't add a changelog section, a "recent updates" note, or a reference to the issue
  number inside the PRD body. The git history is the changelog.
- Keep the edit as small as it can be while being true. Rewriting a whole section when one
  sentence was wrong makes the diff hard to review.

## 6. Ship it — docs-only PR, auto-merged

Follow `../../work-board/references/ship.md` for house style, with these differences:

**Title.** Conventional-commit, `docs` scope, referencing the issue:
`docs(prd): reconcile scoring rules with shipped implementation (#64)`

No framework-version bump — a PRD update doesn't warrant one. Don't touch
`framework_version` or package manifests in this PR.

**Body.** Lead with what in the PRD was out of date and what it now says. Then:
- The merged code PR this reconciles against (`Refs #64`, and the PR link).
- `## Drift noticed, not fixed` — the list from step 4, if any.
- Any contradiction you raised as a question, so the reviewer sees what was *not* changed.

**Use `Refs #N`, not `Closes #N`.** The issue is already closed by the code PR. `Closes`
on an already-closed issue is noise, and if the issue was reopened it would close it
wrongly.

**Diff hygiene.** The PR must contain **only** documentation files. If your diff has a
source file in it, something went wrong — back it out. A stray code change in a docs PR
that auto-merges is exactly the failure this rule exists to prevent.

**CI green, then merge automatically.** Wait for CI. When it's green and the diff is
docs-only, **merge it yourself** — no waiting for human review. The review happens after
the fact via git history; a docs correction that describes shipped code doesn't need a
gate. Coordinate the merge with the dispatcher as usual so merges don't race
(`../../work-board/references/dispatch.md`).

Never merge red CI. If CI fails on a docs-only change it's usually a lint or link-check
issue — fix it and re-wait.

## 7. Comment on the issue

After the merge, post a short comment so anyone reading the issue later sees the docs
caught up:

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "📝 PRD updated in PR #<pr>.

<which PRD sections changed and what they now say>
<anything left unfixed, and why>"
```

Keep it a few lines and human, matching the no-template spirit used elsewhere.

## 8. Move the card to Done

Move the issue's project card to the **`done`** role using
`../../work-board/references/board.md` Step 6. This is the end of the pipeline — the issue
shipped, a human reviewed it, and the documentation now matches. Nothing further is
expected of it.

**One exception:** if you raised a contradiction that went unanswered, leave the card in
`prd_update`. The reconciliation isn't finished, and moving it to Done would hide an open
product question.

## Summary of state transitions this produces

| Step | Board column | Issue status |
|------|--------------|--------------|
| picked up (QA already moved it here) | prd_update | closed |
| docs PR merged | **done** | closed |
| blocked on a product contradiction | prd_update (stays) | closed, question commented |
