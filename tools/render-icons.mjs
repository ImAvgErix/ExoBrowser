// Renders brand/*.svg to PNGs (and Exo Browser's .ico) inside a running Exo Browser's own chrome page,
// so the result is exactly what Chromium draws. Needs the browser started with EXO_BROWSER_CDP=9333.
// node tools/render-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const port = process.env.PORT || 9333;
const target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.url.includes("exo.browser"));
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const evaluate = (expression) => new Promise((resolve) => {
  const id = ++seq;
  const on = (e) => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener("message", on); resolve(m.result.result.value); } };
  ws.addEventListener("message", on);
  ws.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
});

async function render(svg, sizes, alpha = 1) {
  const url = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  return evaluate(`(async () => {
    const img = new Image(); img.src = ${JSON.stringify(url)}; await img.decode();
    return ${JSON.stringify(sizes)}.map((s) => { const c = document.createElement("canvas"); c.width = c.height = s;
      const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.globalAlpha = ${alpha}; g.drawImage(img, 0, 0, s, s);
      return c.toDataURL("image/png").split(",")[1]; });
  })()`);
}

function ico(pngs, sizes) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((png, i) => {
    const e = 6 + 16 * i, s = sizes[i];
    header.writeUInt8(s >= 256 ? 0 : s, e); header.writeUInt8(s >= 256 ? 0 : s, e + 1);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(png.length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...pngs]);
}

const browserSvg = readFileSync(new URL("brand/exo-browser.svg", root), "utf8");
const shieldSvg = readFileSync(new URL("brand/exo-shield.svg", root), "utf8");

// 16 to 24 px: the Horizon drawn on whole pixels (a heavier ring, the bar 2 px tall in a 1 px dark keyline, without
// the slant), so the title bar and a 100% taskbar show it crisp; the tile and its rim are the drawing's own.
// [ring radius, ring width, the keyline's left and right]
const SMALL = { 16: [4, 2, 1, 15], 20: [5, 2, 2, 18], 24: [6.25, 2, 2, 22] };
function small(svg, n) {
  const defs = svg.slice(svg.indexOf("<defs>"), svg.indexOf("</defs>") + 7);
  const tile = [...svg.matchAll(/<path d="[^"]+" fill="url\(#[ps]\)"\/>/g)].map((m) => m[0]).join("");
  const rim = svg.match(/<path d="[^"]+" fill="none" stroke="url\(#r\)"[^>]*\/>/)[0];
  const [r, width, x0, x1] = SMALL[n], c = n / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}">${defs}<g transform="scale(${n / 64})">${tile}${rim}</g>` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="url(#w)" stroke-width="${width}"/>` +
    `<rect x="${x0}" y="${c - 2}" width="${x1 - x0}" height="4" fill="#0a0a0c"/><rect x="${x0 + 1}" y="${c - 1}" width="${x1 - x0 - 2}" height="2" fill="#fff"/></svg>`;
}

const icoSizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
const browserPngs = [];
for (const s of icoSizes) {
  const [png] = await render(SMALL[s] ? small(browserSvg, s) : browserSvg, [s]);
  browserPngs.push(Buffer.from(png, "base64"));
}
writeFileSync(new URL("src/app.ico", root), ico(browserPngs, icoSizes));
writeFileSync(new URL("brand/exo-browser-256.png", root), browserPngs.at(-1));

const extSizes = [16, 32, 48, 64, 128];
const shieldPngs = (await render(shieldSvg, extSizes)).map((b) => Buffer.from(b, "base64"));
mkdirSync(new URL("brand/shield/", root), { recursive: true });
extSizes.forEach((s, i) => writeFileSync(new URL(`brand/shield/icon_${s}.png`, root), shieldPngs[i]));
writeFileSync(new URL("brand/exo-shield-128.png", root), shieldPngs.at(-1));
const offPngs = (await render(shieldSvg, extSizes, 0.4)).map((b) => Buffer.from(b, "base64"));
extSizes.forEach((s, i) => writeFileSync(new URL(`brand/shield/icon_${s}_off.png`, root), offPngs[i]));
console.log("icons written");
process.exit(0);
