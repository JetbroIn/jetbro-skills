export type BoardLinks = { title: string; board: string; code: string; prs: string }

declare module 'claude-code' {
  interface PluginState {
    'board-counts': { links: BoardLinks | null }
  }
}
