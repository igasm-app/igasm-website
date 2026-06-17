// Regenerate the APP's offline gradient asset from the website's exact ShaderGradient.
//
//   1. npx vite build --config vite.gradient.config.js   (produces dist-gradient/gradient.html)
//   2. node scripts/sync-app-gradient.mjs                 (writes ../igasm/assets/gradientHtml.ts)
//
// The app embeds this self-contained HTML in a WebView so its moving background is
// byte-identical to igasm.in. JSON.stringify makes it a safe JS string literal (the
// inlined three.js minified code contains backticks/${ that a template literal would break).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SRC = new URL("../dist-gradient/gradient.html", import.meta.url);
const OUT = new URL("../../igasm/assets/gradientHtml.ts", import.meta.url);

const html = readFileSync(SRC, "utf8");
const outPath = OUT.pathname;
if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });

const banner =
  "// AUTO-GENERATED from igasm-website (vite.gradient.config.js + scripts/sync-app-gradient.mjs).\n" +
  "// The website's EXACT @shadergradient/react waterPlane, self-contained for the app WebView.\n" +
  "// Do NOT edit by hand. Regenerate after any gradient change. The gradient is founder-locked.\n";
writeFileSync(outPath, `${banner}export const GRADIENT_HTML = ${JSON.stringify(html)};\n`, "utf8");

console.log(`wrote ${outPath} (${(html.length / 1024).toFixed(0)} KB of HTML)`);
