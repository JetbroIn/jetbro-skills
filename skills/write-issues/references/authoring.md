# Authoring — exploring read-only and writing good issues

This is the procedure for the `write-issues` mode. The goal: turn a conversation about the
product/code into well-formed issues placed correctly on the board.

## 1. Understand before writing (READ-ONLY)

To write a *correct* issue you often need to know how the code actually behaves. Explore
with read-only tools (Read, Grep, Glob) and `gh` reads. **Never edit code, never build,
never open a PR while in this mode.** If understanding requires running something, prefer
reading over executing; if you must run, keep it read-only (e.g. `gh issue list`, tests in
read mode) and never mutate the working tree.

Use this understanding to make issues specific: name the file/module, the observed vs.
expected behavior, and the likely root cause when you can see it.

## 2. Resolve the board and repo

Per `../work-board/references/board.md`: establish the real repo (not the folder name),
discover the org Projects v2 board this project's issues live on, read the real Status
options and fuzzy-map them to roles. You need this to place new issues in the right column
and project. If the board is ambiguous, ask the user once.

## 3. Writing the issue — judgment, not a template

There is **no fixed format**. Write each item using common sense and first principles: let
the *thing itself* decide the shape and length. Some items are bugs, some are enhancements,
some are change requests, some are a well-scoped one- or two-liner. Match the writing to
what it actually is.

The only real test: **does it carry enough for someone to pick it up cold and do the right
thing — no more, no less.** A one-line ask that's genuinely clear should stay one line;
padding it with empty "Problem / Expected" headings makes it worse. Something genuinely
ambiguous or subtle deserves the space to explain the current behavior, the intent, the
constraints — as much structure as it needs and no ritual beyond that.

So:
- **Be adaptive.** Short when short is complete; structured when structure earns its keep.
  Don't impose the same skeleton on every issue.
- **Be fulfilling.** Whatever length you choose, the content should actually answer what a
  developer (possibly `/work-board` itself) would need — the where, the what, and the why
  when they aren't obvious. Include suspected root cause / relevant files when you found
  them; leave them out when they'd be noise.
- **Match the item's nature.** A bug reads differently from an enhancement or a change
  request. Title it and frame it as what it is.
- **Follow the team's voice, not a form.** Real titles tend to be crisp and specific, often
  naming the condition or root cause inline, e.g.
  `Users forced to re-login on every deploy — concurrent-refresh rotation race`,
  `Items > Create Item — Group dropdown should support free-text + dropdown (combobox)`,
  `System allows current/future date as DOB during client creation`. Use these as a feel
  for tone and specificity, **not** as a template to fill in.

When unsure how much detail an item needs, ask the user or lean on what you learned reading
the code — don't default to a heavy structure just to be safe.

## 4. Draft, then confirm

Show the user the drafted title + body before creating. Iterate. Author one issue or a
batch, as the conversation calls for. Don't create issues silently — confirm.

## 5. Create the issue and place it on the board

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

## 6. Stay in mode

After creating, remain in authoring mode for the next prompt. Only development requests
should trigger the reminder-and-offer-to-exit; everything else continues authoring. The
mode ends when the user toggles `/write-issues` off or says to exit.
