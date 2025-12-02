import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'Removes all Text and Images from Reddit',
    namespace: 'https://rxliuli.com',
    description: 'Removes all Text and Images from Reddit, leaving only the basic structure of the site.',
    match: ['https://www.reddit.com/**'],
    author: 'rxliuli',
    license: 'GPL-3.0-only',
    'run-at': 'document-start',
  }
}
