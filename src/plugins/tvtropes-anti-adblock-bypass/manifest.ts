import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'TVTropes Anti-Adblock Bypass',
    namespace: 'https://rxliuli.com',
    description: 'Bypass anti-adblock on TVTropes.',
    match: ['https://tvtropes.org/**'],
    author: 'rxliuli',
    license: 'GPL-3.0-only',
    'run-at': 'document-start',
  }
}
