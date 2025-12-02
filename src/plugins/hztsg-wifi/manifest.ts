import type { MonkeyUserScript } from 'vite-plugin-monkey'

export function manifest(): MonkeyUserScript {
  return {
    name: 'Hangzhou Library Wifi Auto Login',
    namespace: 'https://rxliuli.com',
    description: 'Automatically log in to the Hangzhou Library Wifi.',
    match: ['http://3.3.3.3/ac_portal/*/pc.html?*'],
    author: 'rxliuli',
    license: 'GPL-3.0-only',
  }
}
