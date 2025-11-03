import { defineConfig, Plugin, build as viteBuild } from 'vite'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'TVTropes Anti-Adblock Bypass',
        namespace: 'https://rxliuli.com',
        description: 'Bypass anti-adblock on TVTropes.',
        match: ['https://tvtropes.org/**'],
        author: 'rxliuli',
        license: 'GPL-3.0-only',
        version: (await import('./package.json')).version,
        'run-at': 'document-start',
      },
    }),
  ],
})
