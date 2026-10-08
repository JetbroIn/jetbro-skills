# Investigation: from a reported symptom to a proven cause

This is the brief for the background agent investigating one card. It works in its own
worktree, it **never fixes the bug**, and it returns evidence plus a proposed verdict. The
dispatching session posts the verdict (`verdict.md`).

## 1. Pin down the claim

Before running anything, restate the report as three lines, from the full record (body and
every comment):

- **Observed:** what the reporter says happens.
- **Expected:** what they say should happen instead.
- **Where:** the screen, endpoint, job or flow, plus any user, client, data or date
  mentioned.

If you can't fill **Observed** concretely enough to try a reproduction (the report is
"the dashboard is broken" or "it's slow sometimes"), skip straight to a needs-info verdict:
you have nothing to reproduce, and the questions should get you the steps, account and time.
**Needs info** means the missing piece is something the reporter knows; **inconclusive**
means you had enough to work with and the missing piece is something else (production
access, a specific dataset, an expert on the area). If **Expected** is
missing, look for it in the PRD, the docs, the tests, and the issue that built the feature
(search closed issues and merged PRs touching that area). The expected behavior you find is
also how you tell a bug from an enhancement: if the code does what the spec and the
original issue asked for, the report is a change request, not a bug.

## 2. Check it's still live

Cheap checks that end many investigations early:

- **Already fixed?** `git log --oneline --since=<report date> -- <suspect paths>` on the
  default branch, and merged PRs mentioning the area. A fix that landed after the report
  is a strong lead, not a verdict. Call it "not a bug (already fixed)" only when you
  reproduced the bug on the commit before that fix and it no longer reproduces after it.
  If you can't reproduce it on the earlier commit either, you haven't shown the fix
  covers it: that's needs-info or inconclusive.
- **Already reported?** `gh issue list --repo OWNER/REPO --state all --search "KEYWORDS"`.
  A duplicate needs the **same root cause**, not just a similar symptom, so hold the
  duplicate verdict until you know the cause.

## 3. Reproduce it

Reproduction is the core of this stage. Reproduce on the **current default branch**, by the
method the symptom demands, following `../../qa-board/references/verify.md` for standing up
the app, credentials, and evidence standards:

- A **user-visible** symptom is reproduced by standing the app up and doing what the
  reporter did, in a browser, logged in with the project's test credentials. Capture a
  screenshot at the moment it goes wrong.
- A **data or logic** symptom can often be reproduced faster with a test, a script, or a
  direct call to the function or endpoint with the reporter's inputs.
- A symptom that depends on **specific data** (one client's records, a certain date) needs
  that shape of data. Build it with seed data or fixtures. Never connect to production and
  never use production credentials; if only production data shows it, that is a needs-info
  or inconclusive finding, with what a human would need to check there.

Vary one thing at a time when the first attempt doesn't reproduce: a different role, other
browser, empty vs. full data, the date the reporter used. Record each attempt and its
outcome; they go in the hypothesis log either way.

## 4. Keep a hypothesis log

From the first minute, keep a running log. It is the most valuable thing this stage
produces when the bug is hard: a human or a later run starts from it instead of from zero.

```
H1: <cause you suspect>
    for:     <evidence that supports it>
    against: <evidence that contradicts it>
    status:  confirmed | ruled out | open
```

Rank by likelihood, add hypotheses as evidence suggests them, and mark one **ruled out**
only with a reason (a test, a log line, a code path that can't be reached). A hypothesis
you merely stopped looking at stays **open**. On a re-run, start from the previous log:
don't re-test ruled-out entries unless the code they depend on has changed since.

## 5. Find the cause

Once it reproduces, trace it to the line that is actually wrong. Work backwards from the
symptom through the call chain to where a bad value or decision first appears, rather than
patching where it surfaces. (`superpowers:systematic-debugging` and its root-cause tracing
are a good method here if available.)

Then find **when** it broke, which usually explains why:

- `git log -L <start>,<end>:<file>` or `git blame` on the faulty lines, and the PR that
  introduced them (`gh pr list --search <sha> --state merged`).
- When the culprit isn't obvious and the bug has a clear pass/fail check, `git bisect run`
  with that check between a known-good point and the current branch.

Name the introducing PR in the verdict when you find it. It tells the team the blast radius
(everything since that PR) and who has the context. Report it as a fact about the code, not
as blame.

## 6. Write the failing test, and push it

For a confirmed bug, the exit criterion is **a test that fails on the current default
branch because of this bug**, and would pass once it is fixed.

- Put it where the project keeps tests for that area, in its existing framework and style.
  Test the behavior the reporter expected, not the implementation detail you found, so the
  fix is free to choose its approach.
- Run it and **watch it fail for the right reason**: the assertion about the bug, not an
  import error or a missing fixture.
- Commit it alone on a branch named `investigate/<issue-number>-<short-slug>` and push the
  branch. **Do not open a PR** and do not touch the code under test. The `/work-board` build
  agent starts from this branch.
- If the project's CI would fail on a red test, that's expected and fine: nothing merges
  from this branch.

When a test genuinely can't be written (a visual-only glitch, a third-party outage, a
timing issue the suite can't drive), the exit criterion is a **recorded reproduction**
instead: exact steps plus a screenshot, the log lines, or a repro script committed on the
same branch. Say why a test wasn't possible.

## 7. Propose the fix, don't build it

For a confirmed bug, write the fix plan the build agent will start from: the file and
function to change, the approach, and anything risky (a migration, other callers of the same
function, data already corrupted that needs cleaning up). Then draft **acceptance criteria**
in the house style (`../../write-issues/references/authoring.md`): the failing test passes,
plus the user-visible behavior from step 1's **Expected**. `/qa-board` verifies against
these.

Decide whether the fix is clear-cut or needs the team, using the test in
`../../work-board/references/follow-ups.md`: a fix that changes what users see beyond
restoring the expected behavior, touches money, permissions, security or data integrity,
needs a migration, or has more than one reasonable approach needs the team. Say which, and
why.

## 8. Return to the dispatcher

Return, in this order: the proposed verdict, the pinned-down claim (step 1), the
reproduction attempts and outcomes, the hypothesis log, the root cause with file and lines,
the introducing PR, the test branch and test name with its failure output, the fix plan,
draft acceptance criteria, and whether the fix is clear-cut. Leave out what doesn't apply
to the verdict. Then clean up anything you started (containers, servers).

Anything you noticed outside this bug goes in the return as a candidate follow-up, with one
line on why. The dispatcher files it per `../../work-board/references/follow-ups.md`.
