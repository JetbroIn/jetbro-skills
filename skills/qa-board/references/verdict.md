# Verdict — claiming, judging, commenting, moving

Every card leaves `agent_qa` with a comment that says what was checked and how it was
proven. The comment is the durable record: `/work-board` reads it to repair a failure, and
a human reads it to trust the pass.

## 1. Claim the card before verifying

Post a claim comment when verification starts, so a concurrent run or a curious human can
see the card is being worked. **The card does not move** — it stays in `agent_qa` until the
verdict:

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "🔍 Agent QA started — verifying <N> acceptance criteria against PR #<pr>."
```

If you find a claim comment newer than your run's start with no verdict after it, another
QA run is probably in flight on this card. Skip it this pass rather than double-verifying.

## 2. The decision

**Pass** only when *every* acceptance criterion is met and you have evidence for each.

**Fail** when any criterion is not met.

**Neither** — do not force a verdict — when a criterion could not be verified at all
(missing credentials, environment won't start, criterion untestable as written) or the
issue has **no acceptance criteria**. Comment what blocked you, leave the card in
`agent_qa`, and surface it to the user. Never pass a card you couldn't check, and never
fail one for lacking a bar it was never given.

## 3. Pass — comment, then forward to human review

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "✅ QA passed — all <N> acceptance criteria verified.

- [x] <criterion> — <how it was proven: file/lines, test name + result, or what was driven and seen>
- [x] <criterion> — <evidence>

Verified against PR #<pr>. <Anything the human reviewer should still look at.>
<Follow-ups filed, if any: #<n> (Backlog: why), #<n> (Ready)>"
```

Then move the card to **`awaiting_review`** (`../../work-board/references/board.md` Step 6).
The issue **stays closed** — it shipped; QA passing doesn't reopen anything.

## 4. Fail — comment, reopen, send back to Ready

The failure comment is the spec for the repair, so write it for the agent that will act on
it. Be specific about *which* criterion failed and *how you know*:

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "❌ QA failed — <N> of <M> acceptance criteria not met.

- [x] <criterion that passed> — <evidence>
- [ ] **<criterion that failed>** — <what you did, what you expected, what actually happened, with evidence>
- [ ] **<criterion that failed>** — <evidence>

Verified against PR #<pr>. Moving back to Ready for repair.
<Follow-ups filed, if any: #<n> (Backlog: why), #<n> (Ready)>"
```

Then:

```bash
gh issue reopen ISSUE_NUMBER --repo OWNER/REPO
```

and move the card to **`ready`** (board.md Step 6).

The **`❌ QA failed`** marker matters: `/work-board` looks for exactly that string to tell a
repair from fresh work (`../../work-board/references/qa-bounce.md`). Keep it verbatim at the
start of the comment.

Reopening is deliberate — the issue is no longer done, and an open issue in Ready is what
`/work-board` consumes. A closed issue sitting in Ready would be skipped.

## 5. Write findings a repair agent can act on

A failure comment that says "the validation doesn't work" wastes the next build cycle.
State the observation, not a diagnosis you didn't verify:

- **What you did**: "Logged in as the seeded admin, opened Clients > New, entered a DOB of
  2099-01-01 and submitted."
- **What you expected**: "Rejected at entry with a message naming the field."
- **What happened**: "Record saved successfully; it appears in the client list with a
  negative age. Screenshot attached."

Suggest a cause only when you actually found it in the code, and mark it as a suggestion.
The repair agent will read the code itself; a confident wrong diagnosis sends it the wrong
way.

## 6. Tone

Write for a teammate, not a bug tracker. The card failing is a normal outcome of a working
pipeline, not an accusation. State findings plainly, keep them short, and don't editorialize
about the code or whoever wrote it.
