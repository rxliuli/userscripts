import { glob, fs } from 'zx'
import { build } from 'vite'
import monkey from 'vite-plugin-monkey'
import { version } from '../package.json'
import { bundleRequire } from 'bundle-require'
import path from 'path'

const plugins = await glob('./src/plugins/*', {
  onlyDirectories: true,
  cwd: process.cwd(),
})
await fs.rm(path.resolve('./dist'), { recursive: true, force: true })
for (const plugin of plugins) {
  const name = path.basename(plugin)
  console.log(`Building plugin: ${name}`)
  const manifest = (
    await bundleRequire({
      filepath: path.resolve(plugin, 'manifest.ts'),
    })
  ).mod.manifest()
  await build({
    plugins: [
      monkey({
        entry: path.resolve(plugin, 'userscript.ts'),
        build: {
          fileName: `${name}.user.js`,
        },
        userscript: {
          ...manifest,
          version,
        },
      }) as any,
    ],
    build: {
      emptyOutDir: false,
    },
  })
}
