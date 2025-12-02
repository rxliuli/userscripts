import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'Reddit Search Options Persist',
    namespace: 'https://rxliuli.com',
    description: 'Keeps your Reddit search filters (sort, time range, type) when searching with new keywords',
    match: ['https://www.reddit.com/**'],
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
