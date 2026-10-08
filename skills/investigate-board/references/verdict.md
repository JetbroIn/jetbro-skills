# Verdict: claiming, commenting, labeling, closing, moving

Every investigated card gets a comment that starts with a verdict marker. The comment is the
durable record: the `/work-board` build agent reads a confirmed RCA to start the fix, a
reporter reads a needs-info comment to know what to send, and a later run of this skill
reads a previous hypothesis log to continue from it.

## 1. Claim before investigating

```bash
ME=$(gh api user --jq .login)
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "🔬 Investigating (@$ME, /investigate-board).

Trying to reproduce this and find the cause. Nothing will be built until it's confirmed."
```

The card **doesn't move** while it's investigated.

**Markers.** This skill's markers are matched by their **full first-line prefix**, never by
emoji alone (`/qa-board` also posts `🔍` and `✅` comments):

| Prefix | Meaning |
|---|---|
| `🔬 Investigating` | claim |
| `↩️ Investigation released by /investigate-board` | claim released without a verdict |
| `✅ Bug confirmed by /investigate-board` | verdict |
| `🚫 Not a bug, per /investigate-board` | verdict |
| `💡 This is working as built` | verdict |
| `❓ Needs info` | verdict |
| `🔁 Duplicate of #` | verdict |
| `🔍 Investigation inconclusive` | verdict |

A `🔬 Investigating` claim is **live** while it is the latest of these markers on the issue.

**Claim, then verify**, in the same order as `../../work-board/references/claim.md`, so two
sessions never investigate the same card:

1. Re-read the card's Status (board.md Step 5) and labels. If it has left `parked`/`ready`
   or lost the label, drop it.
2. Post the claim comment.
3. Re-read the comments. If another live `🔬 Investigating` claim was posted **before**
   yours, the earlier one wins: delete your comment
   (`gh api -X DELETE "repos/OWNER/REPO/issues/comments/COMMENT_ID"`) and skip the card.
4. Only if yours is the earliest live claim, dispatch the investigation agent.

A live claim from another session under 2 hours old means skip the card this pass; an older
one with no activity since, ask the user whether it's stale, as `claim.md` does. If an
investigation is abandoned, post `↩️ Investigation released by /investigate-board` with the
reason, so the card is free again.

## 2. The verdict comments

Each starts with its marker, verbatim, on the first line. Keep comments short and written
for a teammate; evidence goes in, narration stays out.

### ✅ Confirmed

```markdown
✅ Bug confirmed by /investigate-board.

**Reproduced:** <steps, on which branch/commit, with what data>. <screenshot or output>
**Root cause:** <file:lines> <one or two sentences on what is wrong and why>.
**Introduced in:** PR #<n> (<date>), <omit if not found>.
**Failing test:** `<test name>` on branch `investigate/<N>-<slug>`; fails with `<assertion message>`.

**Fix plan:** <what to change, where, and the approach>. <Risks: migration, other callers, data cleanup.>

**Acceptance criteria**
- [ ] `<test name>` passes
- [ ] <the expected behavior, as the user sees it>

<details><summary>Hypothesis log</summary>

<the log, including ruled-out entries and why>
</details>
```

Then:

- Remove the label: `gh issue edit ISSUE_NUMBER --repo OWNER/REPO --remove-label needs-investigation`.
- Add the repo's existing bug label if the issue lacks one.
- If the fix is **clear-cut**, move the card to `ready` (or leave it there). Anything
  touching money, permissions, security or data integrity is never clear-cut, however
  small the fix. If it **needs the team**, leave the card in `parked` (moving it there if it was in `ready`) and add one
  line to the comment: `**Needs the team before building:** <the decision>`. The
  investigation is still complete; a human promotes it to Ready once decided.

### 🚫 Not a bug

```markdown
🚫 Not a bug, per /investigate-board.

<Which one: works as designed (cite the PRD section, original issue or test that defines the behavior) / environment or data issue (what was actually wrong) / already fixed (by PR #n, verified on current main)>.

**What was checked:** <reproduction attempts and outcomes, with evidence>.
<For data/environment issues: what the reporter or ops should do instead.>
```

Post the comment, remove the label, and move the card to `parked` if it was in `ready`:
an unlabeled card in Ready is something `/work-board` will build, and this one must never
be built. Then **ask the user before closing**: list every pending close with its one-line
reason in the session, together, and close only the ones they approve:

```bash
gh issue close ISSUE_NUMBER --repo OWNER/REPO --reason "not planned"
```

If the user doesn't approve a close, leave it open in `parked`; the comment stands and a
human decides what happens next.

### 💡 Enhancement, not a bug

```markdown
💡 This is working as built, so it's a change request rather than a bug (/investigate-board).

**Current behavior:** <what the code does, and where that behavior was specified: PRD section, issue #n, test>.
**What the report asks for:** <the new behavior>.
<What the team needs to decide.>
```

Remove `needs-investigation` and the bug label, add the repo's existing enhancement label,
and move the card to `parked`. Product decides whether to build it.

### ❓ Needs info

```markdown
❓ Needs info, @<reporter> (/investigate-board).

To reproduce this we need:
1. <specific question: which user/account, exact steps, date and time, what they clicked>
2. <...>

**Tried so far:** <attempts and outcomes, briefly, so nobody repeats them>.
```

Ask only what the investigation actually needs, as specific questions a non-developer can
answer ("which client account were you logged in as?", not "please add more details"). The
label stays and the card stays in its column. The next run picks it back up once someone
replies.

### 🔁 Duplicate

```markdown
🔁 Duplicate of #<n> (/investigate-board): same root cause, <file:lines>.

<One line on why the symptoms differ, if they do. Any evidence from this report worth keeping, copied to #n.>
```

Copy anything useful (a repro, a new affected case) onto the surviving issue. Remove the
label, move the card to `parked` if it was in `ready`, then **ask the user before closing**,
together with any not-a-bug closes (a declined close stays open in `parked`):

```bash
gh issue close ISSUE_NUMBER --repo OWNER/REPO --reason "duplicate"
```

### 🔍 Inconclusive

```markdown
🔍 Investigation inconclusive so far (/investigate-board).

**Tried:** <reproduction attempts and outcomes>.
**Leading hypothesis:** <H-n and the evidence for it>.
**To make progress:** <what's missing: production access, a specific dataset, a human who knows the area>.

<details><summary>Hypothesis log</summary>

<the full log>
</details>
```

The label stays and the card stays put. Surface it to the user. A later run continues from
this log instead of starting over.

## 3. Follow-ups

Unrelated bugs found along the way are filed per `../../work-board/references/follow-ups.md`,
with the provenance line `Found while investigating #<N>.` and listed in the verdict
comment with their number and column.
