# Follow-ups: where findings from a build go

While building an issue, an agent often finds something outside the issue's scope: a nearby
bug, a missing guard, a rough edge, a question about how something should behave. Those
should not be silently fixed inside the current PR (scope creep) and they should not be
dropped. They become **follow-up issues**, and the one real decision is which column they
land in.

## First: does it need a new issue at all?

- **In scope for the current issue?** Then it is not a follow-up. Fix it in this PR.
- **Already tracked?** Search before filing: `gh issue list --repo OWNER/REPO --state open
  --search "KEYWORDS"`. If an issue exists, comment the new finding on it instead.
- **Blocks the current issue?** Then it is a blocking question, not a follow-up. Handle it
  per `park.md`.

## Backlog or Ready: the decision

Ask one question: **does the team (engineering or business) need to know about this, or talk
about it, before it gets built?**

**Yes → `parked` (Backlog).** A human decides whether and when. This is the case when any of
these hold:

- It **changes what users see or do**: behavior, copy, flows, pricing, permissions,
  notifications, anything a client or end user would notice.
- It needs a **product or business decision**: what the right behavior is, whether it is
  worth doing, how it is prioritised against other work.
- It is a **significant technical choice**: architecture, a schema or data migration, a new
  dependency, a public API change, anything hard to reverse.
- It touches **security, privacy, money, or data integrity**, even if the fix looks small.
  The team should know these exist.
- It is **big or fuzzy**: you can't write concrete acceptance criteria for it, or it would
  take more than a small, contained PR.

**No → `ready`.** Nobody would notice the change except by reading the diff, and there is
nothing to discuss. Typical cases:

- A **simple, obvious fix** with one right answer: an off-by-one, a missing null check, a
  wrong log level, a flaky assertion, a typo in an error message nobody sees.
- A **minor internal improvement**: dead code, a small refactor, a missing test, a lint or
  type fix, a clearer name.

When it is genuinely unclear, choose **backlog**. A wrongly parked issue costs a human a
glance; a wrongly readied one gets built with no human ever seeing it.

**Remember what Ready means.** `/work-board` will pick up anything in Ready, possibly in the
very next loop pass, and build it unsupervised. So a follow-up only goes to Ready if it is
also **self-contained and specified well enough to build from its text alone**, with
concrete acceptance criteria. If you can't write those, it goes to backlog regardless of
size.

## Filing it

Write the issue in the team's house style (`../../write-issues/references/authoring.md`,
section 5: a functional title, a plain-language description, technical notes below a
`---`). Add a short provenance line so a reader knows where it came from, and for a backlog
issue, say what needs discussing:

```
Found while building #<N> (PR #<pr>).

<for backlog: what the team needs to decide or know, in one or two lines>
```

Then place it on the board (board.md Steps 5–6): add it to the project, then set Status to
the column you chose.

**Labels.** Every follow-up, Backlog or Ready, gets the `claude-follow-up` label, so the
team can filter to everything Claude filed and check its Backlog/Ready calls. Create the
label once if the repo doesn't have it yet (`--force` makes this safe to re-run):

```bash
gh label create claude-follow-up --repo OWNER/REPO --color BFD4F2 \
  --description "Filed by Claude while building or QA-ing another issue" --force
```

Beyond that one, apply only labels the repo already uses; don't invent new ones.

## Report it

- List every follow-up in the **completion comment** on the original issue (`ship.md`
  section 6), with its number and which column it went to.
- Report them to the dispatcher, which tells the user in the session, **backlog ones
  first**, since those are the ones waiting on a human. Say in one line why each backlog
  item needs the team.

## When `/qa-board` uses this

`/qa-board` files follow-ups by the same rule, for real bugs it notices outside the
acceptance criteria while verifying a card. Two differences:

- Skip the "in scope, fix it in this PR" check: QA never fixes code. A finding that breaks
  an acceptance criterion is a QA failure, not a follow-up.
- The provenance line reads `Found while QA-verifying #<N> (PR #<pr>).`, the follow-ups go
  in the verdict comment instead of a completion comment, and they are reported in the
  session instead of to a dispatcher.
