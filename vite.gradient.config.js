import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds ONLY the gradient page (gradient.html) into ONE self-contained HTML with
// all JS/CSS inlined, so the app can embed the website's exact ShaderGradient in a
// WebView, offline. Output: dist-gradient/gradient.html
// Then, in the app repo: node scripts/sync-app-gradient.mjs (writes ../igasm/assets/gradientHtml.ts).
// The website's own build (vite.config) never sees any of this.

// A build-time trim of @shadergradient/react, for this page only, measured pixel-identical (app repo
// docs/TECH.md, "Gradient performance"). The grain is a halftone pass whose getSample() averaged 9 texture
// reads of ONE point (its scatter radius is 0, so every read lands on the same texel): 108 reads a pixel.
// One read returns the same value: 12 reads a pixel. The build fails if the library code it expects is
// gone, so a library update can never slip past it silently.
// Measured and REJECTED (not invisible: they move single grain dots): fewer waterPlane segments (192 ->
// 128/96/64) and a smaller scene render target (0.75, 0.5). The gradient is founder-locked.
const HALFTONE_FROM = "vec4 tex = texture2D( tDiffuse, vec2( point.x / width, point.y / height ) );";
const HALFTONE_TO = "return texture2D( tDiffuse, vec2( point.x / width, point.y / height ) );\n\t\t\tvec4 tex;";

function gradientTrims() {
  let applied = false;
  return {
    name: "igasm-gradient-trims",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("@shadergradient/react/dist/") || !code.includes("const int samples = 8;")) return null;
      if (!code.includes(HALFTONE_FROM)) throw new Error("gradient trim: halftone getSample() not found, update vite.gradient.config.js");
      applied = true;
      return { code: code.split(HALFTONE_FROM).join(HALFTONE_TO), map: null };
    },
    buildEnd() {
      if (!applied) throw new Error("gradient trim: the halftone shader was not found, update vite.gradient.config.js");
    },
  };
}

export default defineConfig({
  base: "./",
  css: { postcss: { plugins: [] } },
  plugins: [gradientTrims(), react(), viteSingleFile()],
  build: {
    outDir: "dist-gradient",
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: "gradient.html",
      output: { inlineDynamicImports: true },
    },
  },
});
