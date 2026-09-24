# Claim: announce a pickup so two sessions never build the same card

Several engineers may run `/work-board` against the same board at the same time, each in
their own session. Nothing about moving a card is atomic across sessions: two dispatchers can
read the same Ready queue a few seconds apart and both decide to build the same issue. The
claim comment is how they see each other.

**Every pickup is claimed on the issue before any build agent is dispatched.** No claim, no
dispatch. This applies to fresh issues and QA-bounce repairs alike.

## The claim marker

A claim is an issue comment whose first line starts with `🔨 Claimed by /work-board`. Other
sessions search for that exact prefix, so keep it verbatim.

```bash
ME=$(gh api user --jq .login)
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "🔨 Claimed by /work-board (@$ME).

Building this now in a background agent. Please don't pick it up in another session.
<one line on what this pass is: fresh build, or a repair of the QA failure above>"
```

Write the second part for a teammate glancing at the issue: it should say who has it and
that it is actively being worked, not describe the session's internals.

## Is a card already claimed?

A claim is **live** when it is the most recent pipeline marker on the issue. These markers
end a claim, whatever came before them:

| Marker | Posted by |
|--------|-----------|
| `✅ Done in PR #N` | `ship.md`, after merge |
| `❌ QA failed` | `/qa-board`, when it bounces a card back to Ready |
| `⏸️` (blocked / needs a human) | `park.md`, `qa-bounce.md` |
| `↩️ Released by /work-board` | this file, below |

So a QA-bounced card has an old claim followed by `✅ Done` and `❌ QA failed`: that claim is
dead and the card is free. A card whose latest marker is a `🔨 Claimed` comment is taken.

When listing the Ready queue, read each card's comments (you already do, per
`issue-context.md`) and **skip any card with a live claim**, even though it sits in Ready.
Tell the user about it ("#42 is in Ready but @alice's session claimed it 2h ago"): that
usually means a session died between claiming and moving the card, and a human should decide
whether to release it. Never take over someone else's live claim on your own.

A card in the `active` column is someone's work in progress, claim comment or not, so this
skill never claims it from the Ready queue. The one exception is a card a human reviewer
reopened and moved back to `active` (`ship.md` section 8): continuing that still needs a
fresh claim before any build starts, since the previous one ended at `✅ Done`.

## Claim, then verify, then move

The order matters, because it is what resolves a race:

1. **Re-read the card's Status** (board.md Step 5) right before claiming. If it is no longer
   in `ready`, someone else got there first: drop it and move on.
2. **Post the claim comment.**
3. **Re-read the issue's comments.** If another live `🔨 Claimed` comment exists that was
   posted **before** yours, the earlier claim wins. Delete your own claim comment, do not
   move the card, and move on to the next issue:
   ```bash
   gh api -X DELETE "repos/OWNER/REPO/issues/comments/COMMENT_ID"
   ```
   (Get your comment's id from `gh api repos/OWNER/REPO/issues/ISSUE_NUMBER/comments`.)
4. **Only if yours is the earliest live claim**, move the card to `active` (board.md Step 6)
   and dispatch the build agent.

This is not a perfect lock, but with both sessions following it the earliest comment wins
deterministically, and the loser backs off before any code is written.

## Releasing a claim without finishing

A claim must always end in one of the markers above, so the next session can see the card
is free. The normal endings already post one (`✅ Done`, `⏸️` parked). If a build is abandoned
for any other reason (the agent crashed and won't be retried, the user said to drop it, the
loop was stopped before this issue's build began), release it explicitly:

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "↩️ Released by /work-board (@$ME).

<why it was dropped, and anything a later pass should know>"
```

Then move the card back to `ready` so it re-enters the queue. Never leave a card claimed
and silent: that blocks every other engineer's session from it indefinitely.
