// Downloads a Chrome Web Store extension's CRX from Google's update service and unpacks it, with the
// store's public key written into its manifest so it loads under its real store ID (which sites
// like account.proton.me use to talk to it).
// node tools/fetch-extension.mjs <store id> <folder under extensions/>
import { writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const [id, name] = process.argv.slice(2);
if (!/^[a-p]{32}$/.test(id ?? "") || !name) throw new Error("usage: fetch-extension.mjs <store id> <folder>");
const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=150.0.0.0&acceptformat=crx2,crx3&x=id%3D${id}%26installsource%3Dondemand%26uc`;
const crx = Buffer.from(await (await fetch(url)).arrayBuffer());
if (crx.toString("latin1", 0, 4) !== "Cr24") throw new Error("not a CRX");
const version = crx.readUInt32LE(4);
const zipAt = version === 3 ? 12 + crx.readUInt32LE(8) : 16 + crx.readUInt32LE(8) + crx.readUInt32LE(12);

// The extension ID is the first 16 bytes of SHA-256 of its public key, as letters a to p.
const idOf = (key) => [...createHash("sha256").update(key).digest().subarray(0, 16)].map((b) => String.fromCharCode(97 + (b >> 4), 97 + (b & 15))).join("");
function* fields(buf) {
  let i = 0;
  const varint = () => { let v = 0, s = 0, b; do { b = buf[i++]; v += (b & 0x7f) * 2 ** s; s += 7; } while (b & 0x80); return v; };
  while (i < buf.length) {
    const tag = varint(), type = tag & 7;
    if (type === 2) { const n = varint(); yield [Math.floor(tag / 8), buf.subarray(i, i + n)]; i += n; }
    else if (type === 0) varint(); else if (type === 5) i += 4; else if (type === 1) i += 8; else break;
  }
}
let key = version === 2 ? crx.subarray(16, 16 + crx.readUInt32LE(8)) : null;
if (version === 3) {
  for (const [field, proof] of fields(crx.subarray(12, zipAt)))
    if (field === 2 || field === 3) for (const [f, value] of fields(proof)) if (f === 1 && idOf(value) === id) key = value;
}
if (!key) throw new Error("no public key matching " + id);

const out = fileURLToPath(new URL(`../extensions/${name}/`, import.meta.url));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const zip = out + "..\\" + name + ".zip";
writeFileSync(zip, crx.subarray(zipAt));
execFileSync(process.env.SystemRoot + "\\System32\\tar.exe", ["-xf", zip, "-C", out]);
rmSync(zip);
rmSync(out + "_metadata", { recursive: true, force: true });
const manifestFile = out + "manifest.json";
const manifest = JSON.parse(readFileSync(manifestFile, "utf8").replace(/^﻿/, ""));
manifest.key = key.toString("base64");
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`${name} ${manifest.version}: ${crx.length} bytes, id ${idOf(key)}`);
