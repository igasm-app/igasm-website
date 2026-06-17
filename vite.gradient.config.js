import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds ONLY the gradient page (gradient.html) into ONE self-contained HTML with
// all JS/CSS inlined, so the app can embed the website's exact ShaderGradient in a
// WebView, offline. Output: dist-gradient/gradient.html
// Regenerate the app asset after building: see scripts/sync-app-gradient.mjs intent
// (we read dist-gradient/gradient.html and JSON-stringify it into ../igasm/assets/gradientHtml.ts).
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
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
