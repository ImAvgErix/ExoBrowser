// Exo Browser wears Exo Launcher's whole design (tokens.css imports every room's styles: Discord, the Store, Music, the
// Library...), but its pages use about a tenth of it. Every page loaded all of it: 360 KB of rules parsed by the Bar and
// by each new tab, and matched again on every change to the page. At build, each stylesheet keeps only the rules that
// can match something the shipped code can put on a page: a selector is dropped when it needs a class that appears
// nowhere in the built scripts (a class made of two words there, as `is-${size}` makes is-roomy, counts as there).
// Classes inside :not(), :is(), :where() and :has() may or may not apply, so they never drop a selector.
import { createHash } from 'node:crypto'
import postcss from 'postcss'

const WORD = /[A-Za-z0-9_-]+/g

/** The classes a selector can't match without (outside the functional pseudo-classes). */
export function neededClasses(selector) {
  let s = selector, prev
  do { prev = s; s = s.replace(/:(?:not|is|where|has|nth-child|nth-last-child|nth-of-type)\([^()]*\)/g, '') } while (s !== prev)
  return [...s.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m => m[1])
}

/** Whether a stylesheet can keep a selector, given every word the shipped code holds. */
export function canMatch(words) {
  const prefixes = [...words].filter(w => w.endsWith('-'))
  const known = (c) => words.has(c) || prefixes.some(p => c.length > p.length && c.startsWith(p) && words.has(c.slice(p.length)))
  return (selector) => neededClasses(selector).every(known)
}

export function prune(css, keep) {
  const root = postcss.parse(css)
  root.walkRules(rule => {
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return
    const selectors = rule.selectors.filter(keep)
    if (!selectors.length) rule.remove()
    else if (selectors.length < rule.selectors.length) rule.selectors = selectors
  })
  // Media queries and supports blocks left with nothing in them (an emptied @layer stays: its first place sets the
  // cascade order of the layers).
  let emptied
  do {
    emptied = false
    root.walkAtRules(at => { if (at.nodes && !at.nodes.length && at.name !== 'layer') { at.remove(); emptied = true } })
  } while (emptied)
  return root.toString()
}

export default function pruneCss() {
  return {
    name: 'exo-browser-prune-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const words = new Set()
      for (const out of Object.values(bundle)) if (out.type === 'chunk') for (const m of out.code.matchAll(WORD)) words.add(m[0])
      const keep = canMatch(words)
      const renamed = []
      for (const out of Object.values(bundle)) {
        if (out.type !== 'asset' || !out.fileName.endsWith('.css')) continue
        out.source = prune(String(out.source), keep)
        // The name's hash was the whole sheet's: a new one for what's left, so one name never stands for two contents.
        const hash = createHash('sha256').update(out.source).digest('base64url').slice(0, 8)
        const name = out.fileName.replace(/-[\w-]{8}\.css$/, `-${hash}.css`)
        if (name !== out.fileName) renamed.push([out.fileName, name])
      }
      const base = (f) => f.slice(f.lastIndexOf('/') + 1)
      for (const [from, to] of renamed) {
        const { source } = bundle[from]
        delete bundle[from]
        this.emitFile({ type: 'asset', fileName: to, source })
        for (const o of Object.values(bundle)) {
          if (o.type === 'chunk') {
            o.code = o.code.replaceAll(base(from), base(to))
            if (o.viteMetadata?.importedCss.delete(from)) o.viteMetadata.importedCss.add(to)
          } else if (typeof o.source === 'string') o.source = o.source.replaceAll(base(from), base(to))
        }
      }
    },
  }
}
