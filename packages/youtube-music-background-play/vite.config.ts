import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/userscript.ts',
      userscript: {
        name: 'YouTube Music Background Play',
        namespace: 'https://rxliuli.com',
        description: 'Keep YouTube Music playing in background',
        match: ['https://music.youtube.com/*'],
        'run-at': 'document-start',
        sandbox: 'DOM',
        grant: 'none',
        author: 'rxliuli',
        license: 'GPL-3.0-only',
        version: (await import('../../package.json')).version,
      },
    }),
  ],
  publicDir: false,
})
