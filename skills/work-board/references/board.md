# Board plumbing — GitHub Projects v2

This is the shared reference for anything that reads or writes the project board.
Every query below is real and has been verified against a live board. Substitute the
repo/project/issue numbers for the situation at hand.

> **Golden rule: never trust the local folder name or its `origin`.** A checkout named
> `phlo-goldmine` was observed to have `origin = enterpriseagentstack/phlo` (the
> framework), while its board work actually lives in `enterpriseagentstack/phlo-goldmine`.
> Always resolve the board from **where the issues actually are**, using the steps below.

---

## Step 1 — Establish the working repo

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
```

Treat this as a *starting hint*, not the truth. If the board (Step 2) turns out to be
populated by a different repo, prefer the repo that the board's items come from and tell
the user about the mismatch.

## Step 2 — Discover the board (org Projects v2)

Boards are **org-level** Projects v2, one per client. List them:

```bash
gh api graphql -f query='
{
  organization(login: "OWNER") {
    projectsV2(first: 30) { nodes { number title closed } }
  }
}'
```

To find *which* project a repo's work lives on, read a project's items and look at each
item's source repository — the project whose items come from the target fork is the one:

```bash
gh api graphql -f query='
{
  organization(login: "OWNER") {
    projectV2(number: PROJECT_NUMBER) {
      items(first: 20) {
        nodes {
          content {
            ... on Issue { number title repository { nameWithOwner } }
            ... on PullRequest { number repository { nameWithOwner } }
          }
          fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
        }
      }
    }
  }
}'
```

If more than one board could plausibly match, **ask the user once** which board this repo maps to. Do not guess.

## Step 3 — Read the real Status field + option IDs

Column names differ per board. Read the actual options (you need the IDs to mutate):

```bash
gh api graphql -f query='
{
  organization(login: "OWNER") {
    projectV2(number: PROJECT_NUMBER) {
      id
      field(name: "Status") {
        ... on ProjectV2SingleSelectField { id options { id name } }
      }
    }
  }
}'
```

This returns `project.id`, the Status `field.id`, and each option's `{id, name}`.
Cache these three for the rest of the session — they don't change mid-run.

## Step 4 — Fuzzy-map columns to roles

Never hardcode column names. Map the board's real option names to these five **roles** by
meaning (case-insensitive, substring/synonym match):

| Role | Matches names like |
|------|--------------------|
| `parked` (backlog) | Todo, Backlog, Icebox, Triage, New |
| `ready` | Ready, To Do, Up Next, Selected |
| `active` | In Progress, Doing, WIP, Building, Started |
| `awaiting_review` | In Review, Review, QA, Testing, Verify |
| `done` | Done, Shipped, Closed, Complete |

Rules:
- The **`ready`** role is the only queue the skill consumes from. If no option maps to
  `ready` with confidence, **ask the user** which column means "cleared to work" — never
  guess, because guessing wrong means working the wrong cards.
- Likewise confirm the `parked` target before parking a blocked issue there.
- A board may have extra columns with no role — leave them untouched.

## Step 5 — Resolve an issue → its project item

Board mutations act on the **project item**, not the issue. Get the item id (and its
current Status) for an issue:

```bash
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: ISSUE_NUMBER) {
      number title
      projectItems(first: 5) {
        nodes {
          id
          project { number title }
          fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name optionId }
          }
        }
      }
    }
  }
}'
```

If `projectItems` is **empty**, the issue is not on any board. Either it belongs to a
different repo than expected (see the golden rule), or it needs adding to the project
first with `addProjectV2ItemById` (mutation below). Pick the `projectItems` node whose
`project.number` matches the board from Step 2.

## Step 6 — Move a card (the mutation)

Uses `project.id` (Step 3), the item id (Step 5), the Status `field.id` (Step 3), and the
target option id (Step 3):

```bash
gh api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: "PVT_xxx"
    itemId: "PVTI_xxx"
    fieldId: "PVTSSF_xxx"
    value: { singleSelectOptionId: "OPTION_ID" }
  }) { projectV2Item { id } }
}'
```

To add an issue to the board first (when it has no project item):

```bash
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_xxx"
    contentId: "ISSUE_NODE_ID"
  }) { item { id } }
}'
```

(Get `ISSUE_NODE_ID` from the issue's `id` field via the repository→issue query.)

## Step 7 — List the Ready queue

Combine the above: read the board's items, keep those whose Status maps to the `ready`
role, that are **open** issues (not PRs), from the target repo. That list — oldest first
by default, or however the user prefers — is what the skill picks up from.

---

## Reference: verified example (Goldmine)

Confirmed live, useful as a sanity check that the queries above work:

- Org: `enterpriseagentstack`, project **#11** ("Goldmine"), `id = PVT_kwDODcCIDM4Bcmbm`
- Status field `id = PVTSSF_lADODcCIDM4BcmbmzhXN-6Y`, options:
  Todo `f75ad846` · Ready `a7fc0629` · In Progress `47fc9ee4` · In Review `a4b8341c` · Done `98236657`
- Board items come from **`enterpriseagentstack/phlo-goldmine`** (the fork) — even though a
  local `phlo-goldmine` checkout may have `origin = enterpriseagentstack/phlo`.

**Do not hardcode these** — they are illustrative. Always resolve IDs live per board, so
the skill works on every client project, not just Goldmine.
