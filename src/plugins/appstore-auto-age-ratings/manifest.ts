import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'App Store Connect - Auto NO Age Ratings',
    namespace: 'https://github.com/rxliuli',
    description: 'Auto-select false/NONE on menu click until Save appears; warns only once if no false/NONE found',
    match: ['https://appstoreconnect.apple.com/apps/*'],
    icon: 'https://www.apple.com/favicon.ico',
    grant: ['GM_registerMenuCommand'],
    'run-at': 'document-end',
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
