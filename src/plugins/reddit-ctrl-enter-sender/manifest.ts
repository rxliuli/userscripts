import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'Reddit Ctrl+Enter Sender',
    namespace: 'https://rxliuli.com',
    description: 'Use Ctrl/Cmd+Enter to quickly send replies, comments, or save edits on Reddit.',
    match: ['https://www.reddit.com/**'],
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
