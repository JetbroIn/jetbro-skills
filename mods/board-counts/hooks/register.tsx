import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { BoardLinks } from '../types'
import { COUNT_QUERY, DETECT_QUERY, pickProject, statusText } from './board'
import type { CountPage, DetectData } from './board'

const POLL_MS = 60_000
const links = atom({ plugin: 'board-counts', key: 'links' } as const, null)

async function gh($: EngineInterface, args: string[]): Promise<unknown> {
  const ran = await $.process.run(['gh', ...args], { timeoutMs: 20_000 })
  if (ran.exitCode !== 0) throw new Error(`gh ${args[0]} failed`)
  return JSON.parse(ran.stdout)
}

function graphql($: EngineInterface, query: string, vars: Record<string, string>) {
  const flags = Object.entries(vars).flatMap(([k, v]) => ['-f', `${k}=${v}`])
  return gh($, ['api', 'graphql', '-f', `query=${query}`, ...flags])
}

let projectId: string | undefined
let isBusy = false

// Finds the board from where this repo's issues actually live, not from
// the folder name (see work-board's golden rule).
async function detect($: EngineInterface) {
  const repo = (await gh($, ['repo', 'view', '--json', 'nameWithOwner'])) as { nameWithOwner: string }
  const [owner = '', name = ''] = repo.nameWithOwner.split('/')
  const data = (await graphql($, DETECT_QUERY, { owner, name })) as { data: DetectData }
  const project = pickProject(data.data)
  const code = data.data.repository?.url

  projectId = project?.id
  const found: BoardLinks | null =
    project && code
      ? { title: project.title, board: project.url, code, prs: `${code}/pulls` }
      : null
  await update($, links, () => found)
}

async function refresh($: EngineInterface, isRedetect = false) {
  if (isBusy) return
  isBusy = true
  try {
    if (isRedetect || !projectId) await detect($)
    if (!projectId) {
      $.ui.status(undefined)
      return
    }

    let columns: string[] = []
    const statuses: (string | undefined)[] = []
    let after: string | undefined
    do {
      const vars: Record<string, string> = after ? { id: projectId, after } : { id: projectId }
      const page = (await graphql($, COUNT_QUERY, vars)) as { data: CountPage }
      const node = page.data.node
      if (!node) break
      columns = node.field?.options.map(o => o.name) ?? columns
      for (const item of node.items.nodes) statuses.push(item?.fieldValueByName?.name)
      after = node.items.pageInfo.hasNextPage ? node.items.pageInfo.endCursor ?? undefined : undefined
    } while (after)

    $.ui.status(statusText(columns, statuses) || undefined)
  } catch {
    // Not a GitHub repo, gh not signed in, or offline: keep quiet, try again next poll.
  } finally {
    isBusy = false
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'board',
      description: "Refresh the board counts and show links to this repo's board, code and PRs",
    })
    void refresh($)
    $.clock.every(POLL_MS, () => void refresh($))

    return next(e)
  })

  on('command.run', { command: 'board' }, async $ => {
    await refresh($, true)
    const found = await read($, links)
    if (!found) return { text: 'No open project board found for this repo.' }

    return {
      text: [`${found.title}`, `Board: ${found.board}`, `Code: ${found.code}`, `PRs: ${found.prs}`].join('\n'),
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const found = await read($, links)
    if (e.props.hasSurvey || !found) return next(e)

    const { Link, Text } = $.ui.resolve(e)

    return (
      <Text dimColor>
        {found.title}: <Link href={found.board} label="Board" /> ·{' '}
        <Link href={found.code} label="Code" /> · <Link href={found.prs} label="PRs" />
      </Text>
    )
  })
}
