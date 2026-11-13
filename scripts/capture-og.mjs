// Share image recipe (public/og.jpg, 1200x630): a still of the site's own hero, the locked ShaderGradient
// and the locked Instrument Serif "igasm" light-reveal wordmark, exactly as the built site renders them.
// Not part of the build and not a dependency: run it by hand when the share image needs redoing.
//
//   npm run build && npx serve -l 4599 dist          # in one terminal
//   mkdir -p /tmp/og-cap && cd /tmp/og-cap && npm i puppeteer-core@23 sharp
//   NODE_PATH=/tmp/og-cap/node_modules node scripts/capture-og.mjs /tmp/og-frames
//
// It writes 24 frames 2.5 s apart (the gradient moves), at 2x for crisp type. Pick the frame where the
// gradient looks best and has no plane edge in a corner, then downscale it to 1200x630 JPEG (sharp,
// mozjpeg, quality 84, about 115 KB). Capture-only changes, never on the live site: the nav, eyebrow,
// form, scroll cue, seams and the wordmark's blurred glow (which headless Chrome draws as banded rings)
// are hidden, the hero block is centred in 630 px, and the sub line is cut to its first sentence and
// enlarged so it reads at thumbnail size. The wordmark, its light and the gradient are untouched.
import puppeteer from "puppeteer-core";
const out = process.argv[2];
const url = process.argv[3] || "http://localhost:4599/";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text()); });
await page.goto(url, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 2500));
await page.addStyleTag({ content: `
  .nav, .hero-eyebrow, .hero-form, .scroll-cue, .seam-wrap, .cursor-glow, .wm-glow { visibility: hidden !important; }
  html, body { overflow: hidden !important; }
  .hero { padding-block: 0 !important; height: 630px !important; min-height: 630px !important; gap: 0 !important; justify-content: center !important; }
  .hero-lead { margin-top: 64px !important; }
  .hero-sub { font-size: 1.75rem !important; max-width: none !important; }
`});
await page.evaluate(() => {
  const s = document.querySelector(".hero-sub");
  if (s) s.innerHTML = 'Your intimacy, <span class="accent">finally understood</span>.';
  const gl = !!document.querySelector("canvas");
  console.log("canvas", gl);
});
console.log(await page.evaluate(() => { const c=document.querySelector("canvas"); return c ? c.width+"x"+c.height : "no canvas"; }));
for (let i = 0; i < 24; i++) {
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${out}/f${String(i).padStart(2, "0")}.png` });
}
await browser.close();
