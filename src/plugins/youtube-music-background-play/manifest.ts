import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'YouTube Music Background Play',
    namespace: 'https://rxliuli.com',
    description: 'Keep YouTube Music playing in background',
    match: ['https://music.youtube.com/*'],
    'run-at': 'document-start',
    sandbox: 'DOM',
    grant: 'none',
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
