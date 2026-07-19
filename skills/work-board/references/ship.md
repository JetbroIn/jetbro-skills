# Ship — PR → review → CI → merge → close → In Review

This is what a build agent does once the code for an issue is written. The goal: land the
change on `main` with confidence, then hand off to a human for the final manual review.

## 1. Open the PR — in the team house style

Match the conventions observed in real merged PRs on these repos:

- **Title**: conventional-commit, scoped, ending with the framework-version bump and the
  issue number(s) in parens. Examples:
  - `feat(auth): refresh rotation grace window + web test-infra fixes — v0.15.0 (#69, #71)`
  - `fix(web): single-flight token refresh to stop logout-on-deploy — framework v0.14.0 (#69)`
- **Body**: structured markdown. Lead with `## Summary` or `## Problem`, explain the change,
  and **link the issue explicitly** so the merge closes it: `Closes #64.` (use `Closes` /
  `Fixes` so GitHub auto-closes on merge). If the PR addresses several issues, close each.
- **Framework version**: if the change warrants it, bump the `framework_version` source of
  truth and sync any package manifests, as the existing PRs do. Only one in-flight version
  bump at a time (see dispatch.md).

## 2. Self-review

Before asking for merge, the agent reviews its own diff for correctness, scope creep, and
house-style fit. Use the repo's own review tooling if present (e.g. `/code-review`). Fix
what it finds. Do not merge a PR with unaddressed self-review findings.

## 3. CI must be green

Wait for the repo's CI (`.github/workflows/ci.yml`) to pass on the PR. If it fails, read
the failure, fix, push, and re-wait. Never merge red CI.

## 4. Local check when warranted

If the change has runtime surface that CI can't fully exercise (UI behavior, a flow that
needs driving), verify it locally / via the project's run or verify skill and capture
evidence (a screenshot or a short note) in the PR before merging. Skip only for changes
with no runtime surface (docs, pure refactors covered by tests).

## 5. Merge — deliberately, one at a time

Only when self-review is clean, CI is green, and any needed local check passed:

- Coordinate with the dispatcher so merges don't race the same base (dispatch.md).
- Merge the PR (respect the repo's merge style — squash/merge as the repo uses).
- Because the body says `Closes #N`, merging **auto-closes the issue**. Confirm it closed.

## 6. Leave a completion comment on the issue

Before moving the card, post a comment on the now-closed issue summarizing **what was
done** — so the teammate doing the manual review (and anyone reading the issue later) sees
the outcome without digging through the PR.

- **Always state *what* was done** — the change in plain language, and the merged PR link.
- **Explain *how* only when it isn't obvious** — a non-trivial approach, a tricky decision,
  a gotcha, anything a reviewer would otherwise have to reverse-engineer. Skip the "how" for
  straightforward changes; don't narrate the obvious.
- Note any **manual-verification evidence** (screenshot, the flow you drove) if you captured
  it, and anything the reviewer should specifically check.

Keep it short and human — a few lines, matching the flexible, no-template spirit used
elsewhere.

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "✅ Done in PR #<pr>.

<what was implemented, in plain language>
<how — only if non-obvious>
<what the reviewer should check / evidence, if any>"
```

## 7. Move the card to In Review

After merge + issue close + completion comment, move the issue's project card to the
**`awaiting_review`** (In Review) column using board.md Step 6. This is the handoff point.

## 8. Stop — a human takes it from here

Do **not** move the card to Done. Once merged to `main`, CI has run and the change is live
for the team to experience; a human does the manual review and either moves it to **Done**
(happy) or **reopens** the issue and moves it back to the `active` column (needs more work).
If reopened, `work-board` can pick it up again on a later pass — it will reappear as work to
do, not as Ready, so treat a reopened+active card as already-assigned continuation, not a
fresh Ready pick.

## Summary of state transitions this produces

| Step | Board column | Issue status |
|------|--------------|--------------|
| picked up (before build) | active (In Progress) | open |
| PR merged | awaiting_review (In Review) | **closed** |
| human happy | done (Done) — *human does this* | closed |
| human unhappy | active — *human reopens* | reopened |
