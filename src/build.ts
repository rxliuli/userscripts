import { glob, fs, chalk } from 'zx'
import { build } from 'vite'
import monkey from 'vite-plugin-monkey'
import { version } from '../package.json'
import { bundleRequire } from 'bundle-require'
import path from 'path'
import chokidar from 'chokidar'

const isWatchMode = process.argv.includes('--watch') || process.argv.includes('-w')

async function buildScripts() {
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
      logLevel: 'error',
    })
  }
}

buildScripts()
if (isWatchMode) {
  console.log(chalk.blue('Watching for file changes...'))
  chokidar.watch(path.resolve('./src')).on('change', async () => {
    console.log(chalk.blue('File change detected. Rebuilding...'))
    await buildScripts()
  })
}
