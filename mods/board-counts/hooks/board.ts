// Board discovery and counting, kept free of `$` so it can be tested alone.
// Column roles follow work-board's references/board.md fuzzy mapping.

export type Project = { id: string; title: string; url: string; closed: boolean }

type ProjectNodes = { nodes: ({ project: Project } | null)[] }

export type DetectData = {
  repository: {
    url: string
    projectsV2: { nodes: (Project | null)[] }
    issues: { nodes: ({ projectItems: ProjectNodes } | null)[] }
  } | null
}

export type CountPage = {
  node: {
    field: { options: { name: string }[] } | null
    items: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: ({ fieldValueByName: { name: string } | null } | null)[]
    }
  } | null
}

export const DETECT_QUERY = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    url
    projectsV2(first: 10) { nodes { id title url closed } }
    issues(first: 30, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes { projectItems(first: 5) { nodes { project { id title url closed } } } }
    }
  }
}`

export const COUNT_QUERY = `query($id: ID!, $after: String) {
  node(id: $id) {
    ... on ProjectV2 {
      field(name: "Status") { ... on ProjectV2SingleSelectField { options { name } } }
      items(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          fieldValueByName(name: "Status") {
            ... on ProjectV2ItemFieldSingleSelectValue { name }
          }
        }
      }
    }
  }
}`

// Only the three roles the status line shows. A plain "QA" column is a human
// review column, never agent_qa.
const ROLES = [
  { role: 'ready', pattern: /^(ready|to do|up next|selected)\b/i },
  { role: 'active', pattern: /^(in progress|doing|wip|building|started)\b/i },
  { role: 'agent_qa', pattern: /^(agent|ai|bot|automated) qa\b/i },
] as const

export type Role = (typeof ROLES)[number]['role']

export function roleOf(column: string): Role | undefined {
  return ROLES.find(r => r.pattern.test(column.trim()))?.role
}

// The board this repo's work lives on: the open project its recently updated
// issues sit on most, else the one open project linked to the repo.
export function pickProject(data: DetectData): Project | undefined {
  const repo = data.repository
  if (!repo) return undefined

  const seen = new Map<string, { project: Project; hits: number }>()
  for (const issue of repo.issues.nodes) {
    for (const item of issue?.projectItems.nodes ?? []) {
      if (!item || item.project.closed) continue
      const entry = seen.get(item.project.id) ?? { project: item.project, hits: 0 }
      entry.hits += 1
      seen.set(item.project.id, entry)
    }
  }
  const best = [...seen.values()].sort((a, b) => b.hits - a.hits)[0]
  if (best) return best.project

  const linked = repo.projectsV2.nodes.filter((p): p is Project => !!p && !p.closed)
  return linked.length === 1 ? linked[0] : undefined
}

// "Ready 4 · In Progress 2 · Agent QA 1", in flow order and spelled as the
// board spells them; a role the board has no column for is left out.
export function statusText(columns: string[], statuses: (string | undefined)[]): string {
  const parts: string[] = []
  for (const { role } of ROLES) {
    const column = columns.find(c => roleOf(c) === role)
    if (!column) continue
    const count = statuses.filter(s => s === column).length
    parts.push(`${column} ${count}`)
  }
  return parts.join(' · ')
}
