# Verification — proving a criterion, not guessing at it

The point of this stage is to catch what a merged PR and green CI did not. A QA agent that
only reads the diff will pass exactly the bugs CI already missed, because it is looking at
the same artifact the same way. **Method follows the criterion.**

## Choose the method the criterion actually demands

Work criterion by criterion. For each, ask: *what would convince a sceptical reviewer?*

**Reading the merged diff + surrounding code** is sufficient when the criterion is about
the shape of the code: a validation rule exists at both layers, an endpoint requires auth,
a config default changed, a function is no longer called. You can point at the lines.

**Running the project's test suite** is right when the criterion maps onto behavior the
tests exercise, or when the issue asked for test coverage. Cite the test names and results,
not just "suite green."

**Running the application for real** is required whenever the criterion describes what a
*user* sees or does. This is the one agents skip and must not. If the criterion says a
message appears, a field rejects input, a page loads, a flow completes, a report shows the
right number — then **stand the thing up and do it**:

- Bring up the app the way the project actually runs it — `docker compose up`, the
  project's own run/verify skill, or whatever its docs specify.
- Open a browser, **log in with the project's test credentials**, and drive the flow end to
  end like a user would.
- Exercise the failure paths too, not only the happy one. A criterion saying invalid input
  is rejected is verified by *submitting invalid input*.
- Capture a screenshot at the moment of truth.

The bar is robustness, not speed. Spending real time to stand up Docker and click through a
flow is the correct trade when the criterion is about user-visible behavior — a QA pass
that was never observed is worth nothing.

## Where credentials come from

Use the project's documented test/seed credentials (its README, `.env.example`, compose
file, or its own run skill). If a criterion needs a login and you cannot find credentials,
**do not guess and do not fabricate an account** — say so in the verdict comment and ask
the user. Never use production credentials, and never put a credential in an issue comment,
a PR, or a screenshot.

## Run each card in a background worktree agent

Verification builds and runs things, so it must not happen in the main session or in the
user's working tree:

- Spawn a **background** agent per card (`Agent` with `run_in_background: true`) with
  `isolation: "worktree"`, exactly as `/work-board` dispatches builds
  (`../../work-board/references/dispatch.md`).
- Give it a self-contained brief: the resolved repo, the issue's **full record — body,
  every comment, the timeline** — the acceptance criteria, the merged PR to verify, and
  this file's standards. Tell it to **re-read the record itself** before judging; a
  summarised body is how criteria amended in comments get missed.
- Several cards can be verified in parallel. Unlike builds, QA runs don't merge anything,
  so they don't need merge serialization — but if they bring up the same ports or
  containers, serialize those or give each a distinct environment.

**Tooling for the agent.** The dispatching session only reads the board and moves cards; the
*agent* is what stands things up and drives them, so it needs the broader toolset. Spawn it
with the tools its criteria require — Bash for Docker and the test suite, and browser
automation (the project's own Playwright/Chrome tooling, or a `webapp-testing`-style skill)
where a flow has to be driven. If a needed tool genuinely isn't available in the
environment, that is an **unverifiable criterion**, not a pass: report it per
`verdict.md` and let a human decide, rather than downgrading to reading the diff and calling
it verified.

## Evidence — what a verdict must be able to show

Every criterion gets a verdict **and the evidence for it**:

- code: the file and lines that implement (or fail to implement) it;
- tests: which tests, and their output;
- runtime: what you did, what you saw, and a screenshot where it's visual.

"Looks correct" is not evidence. "Appears to be handled" is not evidence. If you could not
verify a criterion at all — no credentials, environment won't start, the criterion is
untestable as written — **say that explicitly** rather than folding it into a pass or a
fail. An unverifiable criterion is a finding in its own right, and it goes to a human.

## Scope

Verify **the acceptance criteria**, not the whole product. If you notice a genuine bug
outside the criteria, mention it in the verdict comment as an observation (and suggest a
new issue) — but do not fail the card for it. The criteria are the contract; failing a card
for something it never promised is how this stage loses the team's trust.
