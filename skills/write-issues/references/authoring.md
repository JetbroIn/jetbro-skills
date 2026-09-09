# Authoring — exploring read-only and writing good issues

This is the procedure for the `write-issues` mode. The goal: turn a conversation about the
product/code into well-formed issues placed correctly on the board.

## 1. Understand before writing (READ-ONLY)

To write a *correct* issue you often need to know how the code actually behaves. Explore
with read-only tools (Read, Grep, Glob) and `gh` reads. **Never edit code, never build,
never open a PR while in this mode.** If understanding requires running something, prefer
reading over executing; if you must run, keep it read-only (e.g. `gh issue list`, tests in
read mode) and never mutate the working tree.

Use this understanding to make issues specific: the observed vs. expected behavior in the
product, and the file/module and likely root cause when you can see them. Section 3 covers
where each of those belongs in the body — the behavior up top, the code detail below.

## 2. Resolve the board and repo

Per `../work-board/references/board.md`: establish the real repo (not the folder name),
discover the org Projects v2 board this project's issues live on, read the real Status
options and fuzzy-map them to roles. You need this to place new issues in the right column
and project. If the board is ambiguous, ask the user once.

## 3. Who reads the issue — functional first, technical below

Issues on these boards are read by two very different people, and **the non-technical one
reads first**. Analysts, QA, and the client's own stakeholders open an issue to understand
*what is wrong with the product and what should happen instead*. A developer (often
`/work-board` itself) opens the same issue to find *where in the code to go*. Writing for
the developer alone is the single most common way an issue fails: the analyst hits a file
path in the first sentence and stops reading.

So the ordering is a rule, not a preference:

**When an issue carries technical detail, the body MUST lead with the functional
description and place the technical content in a clearly separated section below.** Issues
with no technical content need no such split — they are already functional throughout.

**The functional part** (top) is written for someone who will never open the repo. Plain
product language: what happens today, what should happen instead, who it affects and why it
matters. No file paths, no function or component names, no root-cause jargon, no stack
traces. If a reader needs the codebase to understand it, it belongs below the line.

**The technical part** (below) is everything the developer needs and the analyst doesn't:
suspected root cause, the files/modules involved, implementation notes, edge cases,
migration or data concerns. Separate it with a horizontal rule and a heading, exactly:

```markdown
Client records can be saved with a date of birth of today or a future date. A person
cannot be born today or later, so these records are invalid and still flow through to
the downstream reports, where they show impossible ages.

Expected: the date of birth must be strictly in the past. Anything else is rejected at
entry with a clear message telling the user what's wrong.

---
### Technical notes

`ClientForm` validates DOB for type but sets no upper bound, so any parseable date
passes. The API has no equivalent check, so the value is also accepted by direct calls.
Both layers need the bound.

Files: `src/forms/ClientForm.tsx`, `api/clients.py`
```

Use a visible `---` + `### Technical notes` heading rather than a collapsed block — the
developer and `/work-board` should see it without expanding anything.

## 4. Writing the issue — judgment, not a template

Within that ordering there is **no fixed format**. Write each item using common sense and
first principles: let the *thing itself* decide the shape and length. Some items are bugs,
some are enhancements, some are change requests, some are a well-scoped one- or two-liner.
Match the writing to what it actually is.

The only real test: **does it carry enough for someone to pick it up cold and do the right
thing — no more, no less.** A one-line ask that's genuinely clear should stay one line;
padding it with empty "Problem / Expected" headings makes it worse, and so does bolting a
"Technical notes" heading onto an issue that has nothing technical to say. Something
genuinely ambiguous or subtle deserves the space to explain the current behavior, the
intent, the constraints — as much structure as it needs and no ritual beyond that.

So:
- **Be adaptive.** Short when short is complete; structured when structure earns its keep.
  Don't impose the same skeleton on every issue.
- **Be fulfilling.** Whatever length you choose, the content should actually answer what a
  developer (possibly `/work-board` itself) would need — the where, the what, and the why
  when they aren't obvious. Include suspected root cause / relevant files when you found
  them, under the technical heading; leave them out when they'd be noise.
- **Match the item's nature.** A bug reads differently from an enhancement or a change
  request. Title it and frame it as what it is.
- **Titles are functional too.** The board is scanned by the same non-technical readers, so
  a title describes the product problem, not the cause. Keep them crisp and specific, but
  leave the mechanism for the technical section:
  `Users are forced to log in again every time we deploy` (not `... — concurrent-refresh
  rotation race`), `Items > Create Item — Group dropdown should allow typing a new value`,
  `Client can be saved with a date of birth of today or later`. Use these as a feel for
  tone and specificity, **not** as a template to fill in.

When unsure how much detail an item needs, ask the user or lean on what you learned reading
the code — don't default to a heavy structure just to be safe.

## 5. Draft, then confirm

Show the user the drafted title + body before creating. Iterate. Author one issue or a
batch, as the conversation calls for. Don't create issues silently — confirm.

## 6. Create the issue and place it on the board

Create the issue in the resolved repo:

```bash
gh issue create --repo OWNER/REPO \
  --title "TITLE" \
  --body "BODY" \
  --label "LABEL1,LABEL2"    # if labels apply
```

Then add it to the board and set its column (per `../work-board/references/board.md`
Steps 5–6): get the issue's node id, `addProjectV2ItemById` to the project, then
`updateProjectV2ItemFieldValue` to set Status.

**Which column?** Default new issues to the **`parked`** (Todo/Backlog) role — they're not
cleared for development yet. Move an issue to the **`ready`** role only when the user
explicitly says it's ready to be worked (remember: `/work-board` will pick up anything in
Ready). When in doubt, park it and let the user promote it.

**Labels/tags and project**: apply the labels the user wants (bug/feature/area tags), and
make sure it lands on the **correct project board** for this repo — confirm rather than
assume if a repo maps to more than one board.

## 7. Stay in mode

After creating, remain in authoring mode for the next prompt. Only development requests
should trigger the reminder-and-offer-to-exit; everything else continues authoring. The
mode ends when the user toggles `/write-issues` off or says to exit.
