# QA bounce — picking up an issue that failed automated QA

On a board with an `agent_qa` column, a Ready card is not always a fresh piece of work.
`/qa-board` bounces failed cards **back to `ready`**, so the Ready queue mixes:

- **fresh issues** a human promoted, and
- **repairs** — issues that were built, merged, QA'd, and failed.

These need different handling, and telling them apart is only possible by **reading the
comments**. A repair looks exactly like a fresh issue if you read the body alone: the body
still describes the original request, the acceptance criteria still sit under it, and
nothing in the title says "this already failed once." Build it as if it were fresh and you
will re-implement work that already exists and fail QA the same way a second time.

## 1. Detect the bounce

You already read the full record (`issue-context.md`) before picking anything up. On top of
that, look specifically for:

- A **`❌ QA failed`** comment from `/qa-board` (the marker it posts, see
  `../../qa-board/references/verdict.md`). The most recent one is the live one.
- A prior **`✅ Done in PR #N`** completion comment (`ship.md`) — proof the issue was already
  implemented and merged once.
- The issue being **reopened** (`stateReason`, plus a `reopened` timeline event).

Any of these means: **this is a repair, not a build.** If several QA-failure comments
exist, the issue has been round-tripped more than once — read them all, in order, and treat
the pattern as significant (see step 3).

## 2. Repair, don't rebuild

The shipped code is already on `main`. The job is to close the specific gap QA found, not
to redo the issue:

- Start from the **QA comment's failed criteria** — those, and their evidence, are the spec
  for this pass. Criteria that passed are done; don't touch them.
- Read the **original PR's diff** (`closedByPullRequestsReferences` in the record) to see
  what was actually built before writing anything.
- Fix the gap, then follow `ship.md` as normal: PR, self-review, green CI, merge. The PR
  body should reference the issue and say it addresses the QA findings.
- The card follows the usual path afterward — back to `agent_qa` for re-verification.

## 3. Judge whether to repair at all — no counters

There is **no fixed attempt limit**. Decide from the QA comment itself:

**Repair it** when you understand the failure and can fix it: a missed criterion, a real
bug QA reproduced, an edge case that wasn't handled, a criterion that was implemented but
demonstrably doesn't work.

**Escalate to a human** — comment and move the card to `parked` — when the failure is
anything you cannot resolve by writing code:

- The criteria are **ambiguous or contradictory**, and passing them requires deciding what
  the product should do. That is `park.md` territory: never invent a product decision.
- QA's finding is **contested** — you read the code and believe the criterion is actually
  met, or that QA misread the intent. Don't fight the QA agent by re-shipping the same
  thing; put it to a human with your reasoning.
- The fix demands a **materially different approach** than what shipped (a rewrite, a
  schema change, a dependency), i.e. it is no longer a repair.
- The issue has **bounced repeatedly on the same criterion** — a second or third failure on
  the same point means the loop isn't converging, and another lap will not help.

This is a judgment call each time, and escalating on the *first* bounce is correct whenever
the failure is one of the above. Equally, a card that keeps failing on genuinely new,
clearly-understood points can keep being repaired. Read the comments and decide.

## 4. Escalating — the comment

Escalation goes through `park.md`'s policy, with the QA context made explicit:

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "⏸️ Needs a human — parked after QA failure.

QA failed on: <the criteria, quoted from the QA comment>
Why I'm not fixing it directly: <ambiguous criteria / contested finding / needs a
different approach / repeated bounce>
What I'd need to proceed: <the decision or answer required>"
```

Then move the card to `parked` (board.md Step 6) and leave the issue open. Write it for a
teammate reading cold: state the open decision, not "the agent got stuck."

## 5. Never silently loop

The failure mode this whole file exists to prevent is an agent and a QA agent passing the
same card back and forth forever, burning build cycles. If you find yourself about to
attempt the same fix for the same criterion a second time, that is the signal to escalate
instead. Parking is a good outcome; an infinite loop is not.
