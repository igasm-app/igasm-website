import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static, host-anywhere build (relative asset paths). Combines the founder's
// effect repos (ShaderGradient / r3f) governed by the design skills.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 4321, host: "127.0.0.1" },
  build: { outDir: "dist", assetsInlineLimit: 0 },
});
