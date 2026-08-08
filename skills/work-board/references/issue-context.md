# Reading an issue — body, comments, and timeline

**An issue is a conversation, not a description.** The body is only the opening statement.
Scope gets cut in comments, decisions get made in comments, answers to parked questions
arrive as comments, and the timeline records that an issue was closed, referenced, or
superseded elsewhere.

**Never act on the body alone.** Reading only the body is how an agent builds something the
team already rejected, rebuilds something already shipped, or re-asks a question that was
answered last week.

## The read (do this before any judgment about an issue)

One call gets body + comments + state:

```bash
gh issue view ISSUE_NUMBER --repo OWNER/REPO \
  --json number,title,state,stateReason,labels,assignees,body,comments,closedByPullRequestsReferences
```

`comments` gives each comment's `author`, `body`, and `createdAt`. Read them **in order** —
later comments override earlier ones, including the body.

Then the timeline, for things that are not comments:

```bash
gh api "repos/OWNER/REPO/issues/ISSUE_NUMBER/timeline" --paginate \
  --jq '.[] | {event, actor: (.actor.login // "-"), created_at: (.created_at // "-"), body: (.body // "-")}'
```

Useful events: `cross-referenced` and `referenced` (another issue/PR/commit touches this),
`closed` / `reopened`, `labeled` / `unlabeled`, `renamed`, `assigned`, `milestoned`.
Timeline entries vary in shape by event type — not every event has an `actor` or `body`, so
tolerate missing fields rather than assuming a schema. Use a **string** default (`// "-"`),
not `// empty`: in jq, `empty` inside an object constructor discards the *entire* object, so
one `committed` event with no `.actor` will silently swallow rows you needed.

Note the timeline endpoint is paginated: a long-running issue will silently truncate at the
first page without `--paginate`.

## What you are reading for

Before deciding anything about an issue, answer these from the full record:

- **Is it still live?** Superseded by another issue, already fixed by a merged PR, or closed
  and reopened for a different reason than the body describes?
- **Has scope changed?** A comment saying "let's only do the API part for now" **replaces**
  the body's scope. The most recent explicit decision wins.
- **Was a question asked and answered?** If this issue was parked (`park.md`), the unblocking
  answer is a **comment**. That answer is the requirement — you will miss it entirely if you
  read only the body.
- **Did a previous agent already work this?** Completion and progress comments (`ship.md`)
  say what was already done. Re-doing it is waste; contradicting it is worse.
- **Who decided what?** Attribute decisions to people and dates, so you can tell a current
  constraint from a stale opinion.

## When the record conflicts with itself

Prefer, in order: the most recent explicit decision from a maintainer > earlier comments >
the issue body. If a genuine contradiction remains and it changes what you would build,
that is a **blocking question** — ask or park it (`park.md`). Do not silently pick one
reading of an ambiguous thread and build on it.

## Cost

Reading comments is cheap next to building the wrong thing. For a bulk sweep over many
issues (`triage`), it is fine to start from the list view and pull the full record for the
issues you are actually going to act on or flag — but any issue you make a **decision**
about gets the full read first.
