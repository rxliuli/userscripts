import { defineConfig } from 'vite'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/userscript.ts',
      userscript: {
        name: 'Hangzhou Library Wifi Auto Login',
        namespace: 'https://rxliuli.com',
        description: 'Automatically log in to the Hangzhou Library Wifi.',
        match: ['http://3.3.3.3/ac_portal/*/pc.html?*'],
        author: 'rxliuli',
        license: 'GPL-3.0-only',
        version: (await import('../../package.json')).version,
      },
    }),
  ],
  publicDir: false,
})
