# igasm.in - coming soon

The public coming-soon + waitlist site for **igasm**, the private intimacy and menstrual-cycle wellness app (iOS + Android). Warm, intimate, richly animated.

Concept: a warm candlelit page where a single warm light passes through the giant `igasm` wordmark and reveals it, over a living warm gradient, leading down a strictly-gridded editorial scroll to one waitlist field. Brand spelling is **igasm** (all lowercase), never `iGasm`.

## Voice and compliance (read before editing copy)

Public, store-adjacent page, so: tasteful and discreet only (the bold voice is in-app); never explicit; no contraception / fertility / diagnostic / medical claims (informational wellness); 17+. HARD rule: no em-dashes or en-dashes anywhere (hyphens only).

## Stack

**Vite + React** (the founder's effect libraries are React/Three based).

- `index.html` - Vite entry (`#root`)
- `src/main.jsx` - mount
- `src/App.jsx` - all sections + the motion engine (light-reveal wordmark, GSAP reveals, Lenis smooth scroll, cycle ring, nav active-tracking, magnetic CTAs, waitlist)
- `src/components/Background.jsx` - ShaderGradient warm 3D gradient (lazy, code-split, error-boundaried -> CSS fallback)
- `src/components/LiquidSeam.jsx` - Paper Shaders LiquidMetal seam above the footer (lazy)
- `src/styles.css` - warm token system, all section styles, responsive, reduced-motion
- `public/favicon.svg`

Libraries: react 18, three 0.157, @react-three/fiber 8, @react-three/drei 9, @shadergradient/react 2, @paper-design/shaders-react, gsap 3.15, lenis 1.3. Governed by the three design skills in `SKILLS.md`.

Warm palette matches the app (`/Users/areeb/igasm/lib/theme.ts`): plum-black `#1A1416`, rose `#E08AA0`, peach, cream. The animated 3D background and the liquid seam are gated off under `prefers-reduced-motion` and degrade to a still warm gradient.

## Run locally

```bash
cd igasm-website
npm install --legacy-peer-deps
npm run dev      # Vite dev server on http://localhost:4321 (hot reload)
# or:
npm run build    # outputs static dist/
npx serve dist   # (or any static server) to preview the production build
```

## Deploy to igasm.in

`npm run build` produces a static `dist/` (relative asset paths). Host on Vercel / Netlify / Cloudflare Pages / GitHub Pages and point `igasm.in` at it.

## Design references

See `SKILLS.md` for the seven founder-provided design repos (three governance skills + four effect libraries) and exactly how each is applied.

## Repo

`github.com/igasm-app/igasm-website` (branch `main`).
