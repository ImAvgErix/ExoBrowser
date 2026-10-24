// Exo Browser's own design rules for its own CSS (src/browser, src/setup), on top of Exo Launcher's (css-design.mjs,
// which this repo copies and can't add to). Run by `npm run check`.
//   exb/token-color   colors come from Exo's theme tokens: no hex, rgb(), hsl() or named color in a color property, so
//                     every color follows Light, Dark and Void (a literal gold star read 1.4:1 on Light).
//   exb/type-weight   font weights from Exo's scale: 400 body, 500 controls and labels, 600 section names, 650 titles.
//   exb/defined-var   a custom property read without a fallback is defined somewhere (Exo's tokens, this CSS, or the
//                     code that sets it): an undefined one turned a whole `top` invalid and dropped Exo Vault's save
//                     prompt over the Bar.
// A genuine exception at one declaration: `/* design-disable-next-line <rule> -- why */` (the why is required).
//   node scripts/browser-design.mjs
import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const ui = path.resolve(import.meta.dirname, '..')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])
const all = walk(path.join(ui, 'src')).filter(f => /\.(css|tsx?)$/.test(f))
const own = all.filter(f => /[\\/]src[\\/](browser|setup)[\\/]/.test(f) && f.endsWith('.css'))

// Every custom property something defines: in any stylesheet, or set by the code (style props, setProperty).
const defined = new Set()
for (const f of all) {
  const text = fs.readFileSync(f, 'utf8')
  for (const m of text.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1])
  for (const m of text.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) defined.add(m[1])
  for (const m of text.matchAll(/['"](--[\w-]+)['"]\s*:/g)) defined.add(m[1])
}

const COLOR_PROPS = /^(color|background(-color|-image)?|border(-(top|right|bottom|left|block|inline))?(-color)?|outline(-color)?|box-shadow|fill|stroke|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?)$/
const NAMED = /\b(white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|gold|silver|navy|teal|maroon|olive|lime|aqua|fuchsia)\b/i
const literalColor = (v) => /#[0-9a-f]{3,8}\b/i.test(v) || /\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[\d.]/i.test(v) || NAMED.test(v.replace(/var\([^)]*\)/g, ''))
const WEIGHTS = new Set(['400', '500', '600', '650', 'normal', 'inherit'])

const disabledRule = (decl) => {
  const prev = decl.prev()
  if (prev?.type !== 'comment') return null
  const m = /^design-disable-next-line\s+(exb\/[a-z-]+)\s+--\s+\S/.exec(prev.text.trim())
  return m ? m[1] : null
}

const problems = []
for (const file of own) {
  const root = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file })
  root.walkDecls(decl => {
    const at = `${path.relative(ui, file)}:${decl.source.start.line}`
    const off = disabledRule(decl)
    const report = (rule, why) => { if (off !== rule) problems.push(`${at}  ${rule}  ${decl.prop}: ${decl.value}  (${why})`) }
    if (!decl.prop.startsWith('--') && COLOR_PROPS.test(decl.prop) && literalColor(decl.value)) report('exb/token-color', 'use a theme token')
    if (decl.prop === 'font-weight' && !WEIGHTS.has(decl.value.trim()) && !decl.value.includes('var(')) report('exb/type-weight', '400, 500, 600 or 650')
    for (const m of decl.value.matchAll(/var\((--[\w-]+)\s*(,)?/g)) if (!m[2] && !defined.has(m[1])) report('exb/defined-var', `${m[1]} is never defined`)
  })
}
for (const p of problems) console.error(p)
if (problems.length) { console.error(`${problems.length} design problem(s) in Exo Browser's own CSS`); process.exit(1) }
console.log(`browser-design: ${own.length} stylesheets clean`)
