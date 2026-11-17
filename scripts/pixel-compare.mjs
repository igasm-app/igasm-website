// Toolchain change check: renders two builds of the site and of the app's gradient page and compares pixels.
// Not part of the build and not a dependency: run it by hand before merging a bundler or plugin upgrade
// (first used for vite 5 -> 6, README "Vite 6 upgrade").
//
//   # build both sides into folders, serve each (any static server), e.g.
//   python3 -m http.server 4601 -d before-dist & python3 -m http.server 4602 -d after-dist &
//   python3 -m http.server 4603 -d before-grad & python3 -m http.server 4604 -d after-grad &
//   mkdir -p /tmp/pc && cd /tmp/pc && npm i puppeteer-core@23 pngjs@7
//   PC_DEPS=/tmp/pc node scripts/pixel-compare.mjs capture http://127.0.0.1:4601/ http://127.0.0.1:4603/gradient.html /tmp/shots-before
//   PC_DEPS=/tmp/pc node scripts/pixel-compare.mjs capture http://127.0.0.1:4602/ http://127.0.0.1:4604/gradient.html /tmp/shots-after
//   PC_DEPS=/tmp/pc node scripts/pixel-compare.mjs compare /tmp/shots-before /tmp/shots-after
//
// Home page: a virtual clock (performance.now, Date.now, requestAnimationFrame stepped by hand, Math.random
// seeded), warmed up with time frozen until the gradient canvas, fonts and network are in, then stepped at
// 60 fps to each moment; CSS animations (the wordmark sweep) are paused at the same time. Gradient page:
// its own ?freeze=<seconds> hook. Capture twice from the same build first: that is the noise floor.
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
// The two tools live outside the repo (PC_DEPS = the folder they were installed in).
const req = createRequire(`${process.env.PC_DEPS || process.cwd()}/`);
const puppeteer = req("puppeteer-core");
const { PNG } = req("pngjs");
const [mode, ...argv] = process.argv.slice(2);
if (mode === "compare") { await compare(...argv); process.exit(0); }
const [site, grad, out] = argv;
mkdirSync(out, { recursive: true });
const MOMENTS = [2, 8, 20]; // seconds of virtual time after load
const VIEWS = [{ name: "1440", width: 1440, height: 900, deviceScaleFactor: 1 }, { name: "390", width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }];
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
const VCLOCK = `(() => {
  let vt = 0; const base = 1763400000000;
  performance.now = () => vt; Date.now = () => base + vt;
  let q = [], id = 0;
  window.requestAnimationFrame = (cb) => { q.push({ id: ++id, cb }); return id; };
  window.cancelAnimationFrame = (i) => { q = q.filter((e) => e.id !== i); };
  let seed = 12345; Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  window.__step = (n, dt) => { for (let i = 0; i < n; i++) { vt += dt; const run = q; q = []; for (const e of run) { try { e.cb(vt); } catch (err) { console.error(String(err)); } } } return vt; };
  window.__vt = () => vt;
})();`;
const errors = [];
for (const v of VIEWS) {
  // Home page, virtual clock.
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`home ${v.name}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`home ${v.name} pageerror: ${e.message}`));
  await page.setViewport(v);
  await page.evaluateOnNewDocument(VCLOCK);
  await page.goto(site, { waitUntil: "load" });
  // Warm up with frozen time until the gradient canvas exists, fonts are in and the network is quiet.
  for (let i = 0; i < 200; i++) {
    await page.evaluate(() => window.__step(1, 0));
    const ok = await page.evaluate(() => !!document.querySelector("canvas.bg-shader, .bg-shader canvas") && document.fonts.status === "loaded");
    if (ok && i > 20) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 20; i++) { await page.evaluate(() => window.__step(1, 0)); await new Promise((r) => setTimeout(r, 30)); }
  let t = 0;
  for (const m of MOMENTS) {
    const frames = Math.round((m - t) * 60);
    await page.evaluate((n) => window.__step(n, 1000 / 60), frames);
    t = m;
    // CSS animations (the wordmark sheen sweep, live dot, scroll cue) pinned to the same virtual time.
    await page.evaluate((ms) => { for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; } }, m * 1000);
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: `${out}/home-${v.name}-t${m}.png` });
    const wm = await page.$(".wordmark-wrap");
    if (wm) await wm.screenshot({ path: `${out}/wordmark-${v.name}-t${m}.png` });
  }
  await page.close();
  // App gradient page, shader time pinned by its own ?freeze= hook.
  for (const m of MOMENTS) {
    const g = await browser.newPage();
    g.on("console", (x) => { if (x.type() === "error") errors.push(`grad ${v.name}: ${x.text()}`); });
    await g.setViewport(v);
    await g.goto(`${grad}?freeze=${m}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 2500));
    await g.screenshot({ path: `${out}/grad-${v.name}-t${m}.png` });
    await g.close();
  }
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors");

async function compare(a, b) {
  for (const f of readdirSync(a).filter((x) => x.endsWith(".png")).sort()) {
    const A = PNG.sync.read(readFileSync(`${a}/${f}`)), B = PNG.sync.read(readFileSync(`${b}/${f}`));
    if (A.width !== B.width || A.height !== B.height) { console.log(f, "SIZE DIFFERS"); continue; }
    let max = 0, sum = 0, n = 0, px = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      let pmax = 0;
      for (let c = 0; c < 3; c++) { const d = Math.abs(A.data[i + c] - B.data[i + c]); sum += d; n++; if (d > pmax) pmax = d; }
      if (pmax > max) max = pmax;
      if (pmax > 0) px++;
    }
    console.log(`${f.padEnd(26)} ${A.width}x${A.height}  max ${String(max).padStart(3)}  mean ${(sum / n).toFixed(4)}  pixels differing ${((100 * px) / (A.width * A.height)).toFixed(3)}%`);
  }
}
