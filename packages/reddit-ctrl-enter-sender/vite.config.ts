import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/userscript.ts',
      userscript: {
        name: 'Reddit Ctrl+Enter Sender',
        namespace: 'https://rxliuli.com',
        description: 'Use Ctrl/Cmd+Enter to quickly send replies, comments, or save edits on Reddit.',
        match: ['https://www.reddit.com/**'],
        author: 'rxliuli',
        license: 'GPL-3.0-only',
      },
    }),
  ],
  publicDir: false,
})
