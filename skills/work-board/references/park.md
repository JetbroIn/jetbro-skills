# Ask-or-park — handling blocking questions

Sometimes an issue can't proceed without an answer — a business decision ("should renewals
show in the client's local currency or INR?") or a technical one ("which of these two auth
flows do you want?"). Claude must not invent these answers. This is the policy.

## The policy: ask, keep working elsewhere, park if unanswered

1. **Ask the user first, in the main session, one question at a time.** The background agent
   surfaces the question to the dispatcher; the dispatcher puts it to the user in the main
   conversation. Ask the single most-blocking question, not a list.
2. **Meanwhile, keep other work going.** Do not stall the whole board waiting for one
   answer. Other Ready issues / in-flight agents continue (dispatch.md). This is the
   "ask, keep working elsewhere" rule the user chose.
3. **If the answer doesn't come in reasonable time** — the user has moved on, is away, or
   simply hasn't responded while other work has progressed — **park the issue**:
   - Post the question as a **comment on the issue**, phrased so anyone on the team can
     answer it later without the session context. Include what's blocked and the options
     considered.
     ```bash
     gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "⏸️ Blocked on a decision: ...
     Options considered: ... . Parked to backlog until answered."
     ```
   - Move the card to the **`parked`** (Todo/Backlog) column via board.md Step 6.
   - Move the issue back out of `active` — it is no longer being worked.
   - Leave the issue **open** (it's not done, just waiting).
   - The build agent for this issue then stops; its worktree is cleaned up.
4. **Never guess a business/product decision** to keep moving. Parking is the correct,
   safe outcome — the tap stays with the human. A parked issue re-enters the pipeline when
   someone answers and moves it back to Ready.

## What counts as "blocking" vs. a judgment call

- **Blocking (ask-or-park):** product/business intent, ambiguous acceptance criteria,
  choice between materially different technical approaches, anything irreversible.
- **Not blocking (just decide):** ordinary implementation details with an obvious
  house-style default, naming, small refactors. Use judgment; don't ask the user things the
  codebase or conventions already answer.

## Tone of the parked comment

Write it for a teammate reading it cold next week: state what's blocked, the options, and
why a human is needed — not "Claude got stuck." It should read as a clear open decision.
