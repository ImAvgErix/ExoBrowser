// Exo Browser wears Exo Launcher's look from its own copy of Exo's design: the files src/browser and src/setup import from
// Exo (and everything those import in turn), Exo's fonts, and Exo's lint and design rules. When Exo Launcher is
// on this PC (../../ExoLauncher, or EXO_LAUNCHER), this refreshes that copy from it before every build, so the
// browser always matches Exo; anywhere else (a fresh clone, a release build) the copy in this repo is used as is.
// node scripts/sync-exo.mjs [--check]: --check only says whether the copy is behind Exo.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ui = path.resolve(import.meta.dirname, '..')
const exo = path.resolve(process.env.EXO_LAUNCHER ?? path.join(ui, '../../ExoLauncher'), 'ui')
const manifestFile = path.join(ui, 'exo-sync.json')
const check = process.argv.includes('--check')

if (!fs.existsSync(path.join(exo, 'src/tokens.css'))) {
  console.log('Exo Launcher is not on this PC: building with the copy of its design in this repo.')
  process.exit(0)
}

// Imports in TypeScript (import/export ... from, import '...', import('...')) and CSS (@import, url() of a local file).
const IMPORTS = [/\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g, /\bimport\s+['"](\.{1,2}\/[^'"]+)['"]/g, /\bimport\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
  /@import\s+(?:url\()?['"](\.{1,2}\/[^'"]+)['"]/g, /url\(\s*['"]?(\.{1,2}\/[^'")]+)/g]
const EXTENSIONS = ['', '.ts', '.tsx', '.css', '/index.ts', '/index.tsx']

function resolveFrom(file, spec) {
  const base = path.resolve(path.dirname(file), spec)
  for (const ext of EXTENSIONS) if (fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()) return base + ext
  return null
}

function importsOf(file) {
  const text = fs.readFileSync(file, 'utf8')
  return IMPORTS.flatMap(re => [...text.matchAll(re)].map(m => m[1]))
}

// Walk from the browser's own code (its Bar and pages, and its Setup's screens); every file it reaches in Exo's src
// outside those two folders is Exo's design. Exo's own src/setup is Exo Launcher's Setup, not ours.
const ownDirs = ['browser', 'setup']
const exoSrc = path.join(exo, 'src')
const own = target => ownDirs.some(dir => target.startsWith(path.join(exoSrc, dir) + path.sep))
const needed = new Set()
const walk = (file, inExo) => {
  // src/ here mirrors Exo's src/, so a browser file's imports resolve as they would from the same place in Exo's tree.
  const asExo = inExo ? file : path.join(exoSrc, path.relative(path.join(ui, 'src'), file))
  for (const spec of importsOf(file)) {
    const target = resolveFrom(asExo, spec)
    if (!target || !target.startsWith(exoSrc + path.sep) || own(target)) continue
    const key = path.relative(exoSrc, target).replaceAll('\\', '/')
    if (needed.has(key)) continue
    needed.add(key)
    walk(target, true)
  }
}
for (const dir of ownDirs.map(d => path.join(ui, 'src', d)))
  for (const file of fs.readdirSync(dir, { recursive: true }).map(f => path.join(dir, f)))
    if (/\.(tsx?|css)$/.test(file)) walk(file, false)
needed.add('vite-env.d.ts')

// Beside src: Exo's fonts, and the lint and design rules the browser's code is held to.
const files = [
  ...[...needed].sort().map(f => [`src/${f}`, `src/${f}`]),
  ...fs.readdirSync(path.join(exo, 'public/fonts')).map(f => [`public/fonts/${f}`, `public/fonts/${f}`]),
  ['eslint.config.js', 'eslint.config.js'], ['css-design.config.mjs', 'css-design.config.mjs'], ['scripts/css-design.mjs', 'scripts/css-design.mjs'],
]

let commit = ''
try { commit = execFileSync('git', ['-C', exo, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim() } catch { /* not a checkout */ }
const before = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { files: [] }
let changed = 0
for (const [from, to] of files) {
  const source = fs.readFileSync(path.join(exo, from))
  const target = path.join(ui, to)
  if (fs.existsSync(target) && Buffer.compare(fs.readFileSync(target), source) === 0) continue
  changed++
  if (check) { console.log(`behind Exo: ${to}`); continue }
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, source)
}
// A file the browser no longer reaches leaves with it.
const now = new Set(files.map(([, to]) => to))
const gone = before.files.filter(f => !now.has(f))
for (const f of gone) {
  if (check) { console.log(`no longer used: ${f}`); continue }
  fs.rmSync(path.join(ui, f), { force: true })
}
if (check) process.exit(changed || gone.length ? 1 : 0)
fs.writeFileSync(manifestFile, JSON.stringify({ note: 'Written by scripts/sync-exo.mjs: these files are Exo Launcher\'s, copied; change them in Exo.', exo: commit, files: [...now].sort() }, null, 2) + '\n')
console.log(`Exo's design ${changed || gone.length ? `refreshed (${changed} changed, ${gone.length} removed)` : 'already current'} from Exo Launcher ${commit}: ${now.size} files.`)
