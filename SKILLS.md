# Design skills applied to igasm.in

Three external Claude "skills" inform the craft of this site. Read them before changing the design; they are the bar.

## References (saved per founder request)

- **Emil Kowalski - design engineering / animation** - https://github.com/emilkowalski/skill
  (skill file: `skills/emil-design-eng/SKILL.md`; author of Sonner, Vaul; animations.dev)
- **Impeccable - design-system rigor / anti-AI** - https://github.com/pbakaus/impeccable
  (Paul Bakaus; `DESIGN.md` + `skill/SKILL.src.md`)
- **taste-skill - anti-slop frontend** - https://github.com/Leonxlnx/taste-skill
  (`skills/taste-skill/SKILL.md`)

## North star

A warm, candlelit coming-soon page where a single warm light, lagging the cursor, passes through the giant Instrument Serif "igasm" wordmark and reveals it from within, then carries you down a grained, strictly-gridded editorial scroll story, ending in one waitlist field. Warm and intimate, never cold/tech. Rich and full, never empty. Crafted, never generic-AI.

## How each skill is applied

### Emil (motion craft)
- Custom easing tokens in `styles.css`: `--ease-out: cubic-bezier(0.23,1,0.32,1)`, `--ease-in-out: cubic-bezier(0.77,0,0.175,1)`. Built-in eases are too weak.
- `:active { transform: scale(0.97) }` tactile press on CTAs (`.cta`, `.nav-cta`). Never `ease-in` on UI. Never animate from `scale(0)`.
- Animate transform + opacity only (GPU). Reveal stagger 80ms (30-80ms band). UI transitions under ~300ms; reveals 600-800ms.
- Blur-masks the pinned-beat crossfade (`filter: blur(6px)` on inactive beats) so beats melt, not swap.
- The hero light lags the cursor (eased ~0.5s) and auto-sweeps on touch - decorative motion gets spring/eased follow, never 1:1.
- Reduced-motion = gentler, not zero: keep opacity, drop movement; static off-center lit wordmark.

### Impeccable (system rigor)
- One cohesive token vocabulary (warm palette + spacing + type scale) in `:root`. No hand-typed values in page CSS.
- Dark, warm, mineral ground (`#1A1416`) - never pure black, never beige/paper.
- ONE accent carries the brand (rose `#E08AA0`); rose-gold is only a hairline whisper; cycle hues appear only in the ring, always labelled.
- Hairline-first elevation; almost no decorative shadow (the one CTA glow is the deliberate accent moment).
- Texture budget: film grain over the whole site is the anti-AI "a human made this" layer; warmth lives in the gradient + grain.
- Weight/scale/color hierarchy, not ever-larger sizes.

### taste-skill (anti-slop)
- One accent locked across the whole page; one theme (dark) locked, no section inverts.
- Hero is <=4 elements, sub <=20 words, fits the viewport. Centered hero is the allowed exception for a launch/manifesto page where the message is the design.
- No AI-purple/neon gradients, no glassmorphism, no particle field, no three-equal-cards, no Inter-as-display default.
- One CTA label per intent ("Get early access" in nav + join). CTA text fits one line, passes contrast.
- Motion must be motivated; marquee removed (max one rule -> we use zero). Em-dashes and en-dashes fully banned (hyphens only).
- Note: taste-skill flags Instrument Serif as a default AI tell. We keep it deliberately because the founder chose the serif light-reveal wordmark as the signature (the documented "brand brief names it" override), paired with a grotesk for all body/UI.

## Asset / effect libraries (founder-provided 2026-06-15) - the "vote"

Explored all and combined the best of each (not locked to one or two):

- **react-three-fiber** - https://github.com/pmndrs/react-three-fiber - the 3D renderer foundation (React + three). USED (it underpins ShaderGradient).
- **ShaderGradient** - https://github.com/ruucm/shadergradient - warm animated 3D gradient, tuned to the app's plum -> wine -> amber candlelight ramp so it keeps the background the founder loves, now a living 3D field. USED as the background (`src/components/Background.jsx`), wrapped in an error boundary that falls back to the CSS warm gradient.
- **liquid-logo / Paper Shaders** - https://github.com/paper-design/liquid-logo - liquid-metal shader. PLANNED as a sparing accent (restraint per the skills); not yet wired.
- **liquid-glass-js** - https://github.com/dashersw/liquid-glass-js - vanilla Apple-style glass (needs html2canvas). PLANNED for nav/CTA chrome; not yet wired.

Governance skills (always): Emil design-eng, Impeccable, taste-skill (see above).

## Stack
Now a **Vite + React** static build (these effect libs require React + three). `npm run dev` (port 4321) or `npm run build` -> `dist/` (host anywhere static). Libraries: react 18, three 0.157, @react-three/fiber 8, @react-three/drei 9, @shadergradient/react 2, gsap 3.15, lenis 1.3. Fonts: Instrument Serif + Inter. The warm CSS gradient (`.bg-fallback`) + film grain stay as the instant-paint and WebGL-off fallback. Brand spelling: **igasm** (all lowercase) - never `iGasm` (it foregrounds the crude root, reads dated, and risks store approval).
