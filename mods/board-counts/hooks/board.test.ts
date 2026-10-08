import { describe, expect, test } from 'claude-code/testing'

import { pickProject, roleOf, statusText } from './board'
import type { DetectData, Project } from './board'

const goldmine: Project = { id: 'P1', title: 'Goldmine', url: 'https://github.com/orgs/x/projects/11', closed: false }
const other: Project = { id: 'P2', title: 'Other', url: 'https://github.com/orgs/x/projects/2', closed: false }

function repoWith(issueProjects: Project[][], linked: Project[] = []): DetectData {
  return {
    repository: {
      url: 'https://github.com/x/phlo-goldmine',
      projectsV2: { nodes: linked },
      issues: { nodes: issueProjects.map(ps => ({ projectItems: { nodes: ps.map(project => ({ project })) } })) },
    },
  }
}

describe('roleOf', () => {
  test('maps the three shown roles and nothing else', async () => {
    expect(roleOf('Ready')).toBe('ready')
    expect(roleOf('To Do')).toBe('ready')
    expect(roleOf('In Progress')).toBe('active')
    expect(roleOf('Agent QA')).toBe('agent_qa')
    expect(roleOf('Todo')).toBe(undefined)
    expect(roleOf('QA')).toBe(undefined)
    expect(roleOf('In Review')).toBe(undefined)
  })
})

describe('pickProject', () => {
  test('picks the project most recent issues sit on', async () => {
    expect(pickProject(repoWith([[goldmine], [goldmine, other], [other], [goldmine]]))?.id).toBe('P1')
  })

  test('skips closed projects and falls back to a single linked one', async () => {
    expect(pickProject(repoWith([[{ ...other, closed: true }]], [goldmine]))?.id).toBe('P1')
    expect(pickProject(repoWith([], [goldmine, other]))).toBe(undefined)
  })
})

describe('statusText', () => {
  test('counts Ready, In Progress and Agent QA as the board spells them', async () => {
    const columns = ['Todo', 'Ready', 'In Progress', 'Agent QA', 'In Review', 'Done']
    const statuses = ['Ready', 'Ready', 'In Progress', 'Done', undefined, 'Agent QA', 'Ready']
    expect(statusText(columns, statuses)).toBe('Ready 3 · In Progress 1 · Agent QA 1')
  })

  test('leaves out a role the board has no column for', async () => {
    expect(statusText(['Todo', 'Ready', 'In Progress', 'Done'], [])).toBe('Ready 0 · In Progress 0')
  })
})
