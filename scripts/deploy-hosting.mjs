// Firebase Hosting-এ public/ ফোল্ডার আপলোড করে (REST API, কোনো লগইন-টোকেন ফাইল ছাড়া)।
// GitHub Actions থেকে চলে: ACCESS_TOKEN আসে google-github-actions/auth থেকে।
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";
import crypto from "node:crypto";

const SITE = process.env.SITE || "bolora-hilf-al-fudul";
const TOKEN = process.env.ACCESS_TOKEN;
const ROOT = "public";
const API = "https://firebasehosting.googleapis.com/v1beta1";
if (!TOKEN) throw new Error("ACCESS_TOKEN missing");

async function call(method, url, body, raw) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(raw ? { "Content-Type": "application/octet-stream" } : { "Content-Type": "application/json" }) },
    body: raw ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n.startsWith(".")) return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = {};
const blobs = {};
for (const f of walk(ROOT)) {
  const gz = gzipSync(readFileSync(f), { level: 9 });
  const hash = crypto.createHash("sha256").update(gz).digest("hex");
  const path = "/" + relative(ROOT, f).split(sep).join("/");
  files[path] = hash;
  blobs[hash] = gz;
}

const config = {
  cleanUrls: true,
  rewrites: [{ glob: "/admin", path: "/index.html" }],
  headers: [{ glob: "**/*.@(html|js|css|txt)", headers: { "Cache-Control": "no-cache" } }],
};

const version = await call("POST", `${API}/sites/${SITE}/versions`, { config });
console.log("version", version.name);
const pop = await call("POST", `${API}/${version.name}:populateFiles`, { files });
const need = pop.uploadRequiredHashes || [];
console.log(`files ${Object.keys(files).length}, uploading ${need.length}`);
for (const h of need) await call("POST", `${pop.uploadUrl}/${h}`, blobs[h], true);
await call("PATCH", `${API}/${version.name}?update_mask=status`, { status: "FINALIZED" });
const rel = await call("POST", `${API}/sites/${SITE}/releases?versionName=${encodeURIComponent(version.name)}`, {});
console.log("released", rel.name, `https://${SITE}.web.app`);
