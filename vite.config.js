import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static, host-anywhere build (relative asset paths). Combines the founder's
// effect repos (ShaderGradient / r3f) governed by the design skills.
export default defineConfig({
  base: "./",
  plugins: [react()],
  // Pin PostCSS here so a stray postcss.config above the repo (e.g. in the home folder) is never picked up.
  css: { postcss: { plugins: [] } },
  server: { port: 4321, host: "127.0.0.1" },
  build: { outDir: "dist", assetsInlineLimit: 0 },
});
