import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'Duolingo Hide App Popups',
    namespace: 'https://rxliuli.com',
    description: 'Hide app popups and restore scrolling on Duolingo.',
    match: ['https://www.duolingo.com/**'],
    'run-at': 'document-start',
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
