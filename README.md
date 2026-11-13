# igasm.in - coming soon

The public coming-soon + waitlist site for **igasm**, the private intimacy and menstrual-cycle wellness app (iOS + Android). Warm, intimate, richly animated.

Concept: a warm candlelit page where a single warm light passes through the giant `igasm` wordmark and reveals it, over a living warm gradient, leading down a strictly-gridded editorial scroll to one waitlist field. Brand spelling is **igasm** (all lowercase), never `iGasm`.

## Voice and compliance (read before editing copy)

Public, store-adjacent page, so: tasteful and discreet only (the bold voice is in-app); never explicit; no contraception / fertility / diagnostic / medical claims (informational wellness); 17+. HARD rule: no em-dashes or en-dashes anywhere (hyphens only).

## Stack

**Vite + React** (the founder's effect libraries are React/Three based).

- `index.html` - Vite entry (`#root`)
- `src/main.jsx` - mount
- `src/App.jsx` - all sections + the motion engine (light-reveal wordmark, GSAP reveals, Lenis smooth scroll, cycle phase list, nav active-tracking, magnetic CTAs, waitlist)
- `src/components/Background.jsx` - ShaderGradient warm 3D gradient (lazy, code-split, error-boundaried -> CSS fallback)
- `src/components/LiquidSeam.jsx` - Paper Shaders LiquidMetal seam above the footer (lazy)
- `src/styles.css` - warm token system, all section styles, responsive, reduced-motion
- `public/favicon.png` + `public/apple-touch-icon.png` - the founder's final logo

Libraries: react 18, three 0.157, @react-three/fiber 8, @react-three/drei 9, @shadergradient/react 2, @paper-design/shaders-react, gsap 3.15, lenis 1.3. Governed by the three design skills in `SKILLS.md`.

Warm palette matches the app (`/Users/areeb/igasm/lib/theme.ts`): plum-black `#1A1416`, amber `#E8985E`, peach, cream. The animated 3D background and the liquid seam are gated off under `prefers-reduced-motion` and degrade to a still warm gradient.

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

## Learn: the cited content hub (igasm.in/learn)

Eleven static pages under `public/learn/`, **generated** by `scripts/build-learn.mjs` from the app repo's own cited files (`features/learn/cycleGuide.ts`, the cycle guide, and `features/learn/cards.ts`, things worth knowing), so the website says exactly what the app says, card for card. After either file changes in the app, run:

```bash
node scripts/build-learn.mjs      # app repo expected at ../igasm (override: IGASM_APP=<path>)
```

and commit the regenerated pages. Pages: the hub, the seven cycle-guide sets (your period, after your period, mid-cycle, before your period, any day, hormonal methods, changing rhythm), things worth knowing, and two tools: a printable "before your appointment" checklist and a cycle-length calculator that runs only in the browser (no network, no storage, no prediction). The build fails on the health-claim firewall (the app's banned words, checked over each page's whole visible text; the one standing pregnancy line is the only exception), on any em or en dash, and on a non-https source.

**Clinician review is pending.** Research M #14 asks for a named reviewer and review date on every page. None exists yet, so every page says so and carries `noindex`, and the hub is not linked from the homepage. When a reviewer signs off: put their name and date in `REVIEW` in the generator, drop the `noindex` line, regenerate, and add a Learn link to the homepage footer. Note: `npm run dev` (Vite) does not serve folder indexes under `public/`; check these pages on the built `dist/` with any static server.

## Waitlist (reading the signups)

Emails submitted on the site land in Supabase table `public.waitlist_signup`. That table is deny-by-default (the public can only INSERT via the `join_waitlist` RPC, never SELECT), so the list is readable **only with the service_role key** (server-only, RLS-bypassing).

```bash
npm run waitlist            # count + breakdown by source + most recent
npm run waitlist:real       # same, excluding internal agent-livecheck QA rows
npm run waitlist:csv > waitlist.csv   # full CSV export
```

The key is read from `$SUPABASE_SERVICE_ROLE_KEY` or `../igasm-creds/service_role_key.txt` (never hardcoded or committed). Implementation: `scripts/waitlist-export.mjs`. As of 2026-07-13 there are 0 real signups (one internal test row only).

## Design references

See `SKILLS.md` for the seven founder-provided design repos (three governance skills + four effect libraries) and exactly how each is applied.

## Repo

`github.com/igasm-app/igasm-website` (branch `main`).

## Invite links (igasm.in/c#CODE)

`c/index.html` + `src/invite.jsx` (a second Vite entry, built to `dist/c/index.html`). The app shares `https://igasm.in/c#K7Q2-M9XA` (a room code) or `https://igasm.in/c#<24-character invite code>`; any case or grouping works (`src/lib/inviteCode.js` mirrors the app's `features/partners/codeShape.ts`). The code lives only in the URL fragment, which browsers never send to a server; the page makes no request with it, logs nothing, has no analytics, sends no referrer, and is `noindex`. It offers "Open in igasm" (`igasm://rooms/join?code=CODE`, the app's one code box) and, below, the code in upper-case groups of four with a Copy button and the way to enter it by hand. Content-free: no names, nothing about the room.

## Live audit (2026-11-13, lane webaudit)

Audited the live https://igasm.in and every page it links (home, privacy, terms, support, delete, desire, patterns, invite /c, the noindex learn hub, the 404) with headless Chrome at 375 px (mobile emulation) and 1440 px, plus a crawler over every internal and external link. Content was checked against the app's code and `docs/PRIVACY-LEGAL.md`, `STORE-LISTING.md` and `LAUNCH-READINESS.md` in the app repo.

Clean: every internal page and asset returns 200; the 404 page is branded and noindex; no console errors on any page; no horizontal overflow at 375 px; one h1 per page, `lang` set, no unlabelled inputs, no images without alt; titles, meta descriptions, canonical, og and twitter tags on every indexable page; robots.txt and sitemap.xml correct (learn and /c noindex, crawlable, out of the sitemap); HSTS, nosniff, frame deny, referrer and permissions policy headers; no cookies or analytics on the site. Every claim on the app-facing pages (support, delete, privacy, terms, patterns thresholds) matches the app: server-readable, not end-to-end; encrypted in transit and at rest; export and erase in Settings; no ad or analytics SDK (Sentry has no DSN); 8-a-side and 90% range in `features/insights/factors.ts`; no fertility, contraception or diagnostic claim; nothing explicit on indexable pages. Apple's Support URL (/support/, with a contact) and Google's account-deletion URL (/delete/, in-app and email routes, what is erased) both meet the store requirements.

Fixed (branch `web-audit`):
- /desire/ cited Brotto and Graham (2021) through an eprints .docx that returns 401; it now links the published DOI, as the learn hub already does.
- /delete/ said "tap Erase everything, then Erase"; the app's final step is now a hold ("Hold to erase everything", after the app lock if one is set).
- Privacy: the 45-day removal job was described as "being built"; it is live (migration `20261101000003`, daily, 30 days). RevenueCat is named as the subscription manager (account id and status only). New section 13, "This website": no cookies or analytics, what the waitlist keeps (email, source, referrer) and how to remove it, Vercel hosting and Google Fonts receive the IP address, the invite code never leaves the browser.
- Home "Private" vows: "unreadable in between" implied more than transit and at-rest encryption; it now says the servers can read the data to find patterns (D3). "Never shared ... not to anyone" now reads "not to anyone you did not choose" (a linked partner and processors).
- The "back to igasm" link on the static pages is now a 39 px tall tap target (was 19 px).

Left (needs the founder or a later lane):
- www.igasm.in: DNS points at Vercel, but the domain is not added to the Vercel project, so https://www.igasm.in fails TLS (certificate is for igasm.in only). Add `www.igasm.in` in Vercel, Domains, set to redirect to igasm.in.
- No og:image or twitter:image anywhere: shared links showed a text-only card. Fixed 2026-11-13 (lane webpolish), see "Share image" below.
- Fonts load from Google Fonts (disclosed now in the privacy policy). Self-hosting the same Instrument Serif and Inter files would remove the third party; that touches how the locked wordmark's font loads, so it waits for the founder.
- The gradient chunk is about 1 MB (254 KB gzip), lazy-loaded after first paint; it is the locked gradient, so it stays.
- /privacy and /privacy/ (and the other pages) both answer 200; canonical tags point to the slash form, which is enough for search engines.
- Learn hub (noindex): several DOI, Europe PMC and CDC links answer 403 to scripts (bot walls, they open in a browser); one source was a commercial menstrual-cup brand blog (/learn/your-period/); fixed 2026-11-13 (lane webpolish): the card now cites the peer-reviewed review Cetera et al. 2025, Women's Health 21, doi:10.1177/17455057241305072, changed in the app's `cycleGuide.ts` and regenerated here.
- Not on igasm.in: no `apple-app-site-association` or `assetlinks.json` (the invite page opens the app by its custom scheme, so none is needed today).

## Share image (2026-11-13, lane webpolish)

`public/og.jpg` (1200x630 JPEG, about 115 KB) is the share card for every indexed page (home, desire, patterns, support, privacy, terms, delete): `og:image` (absolute https://igasm.in/og.jpg) with type, width, height and alt, plus `twitter:card` `summary_large_image`, `twitter:image` and its alt. The learn pages, /c and the 404 are noindex and carry none.

It is a still of the site itself, not a new design: the built site rendered in headless Chrome at 1200x630 (2x), with the locked ShaderGradient and the locked Instrument Serif light-reveal wordmark exactly as they ship, and the hero's own first line, "Your intimacy, finally understood." The frame was chosen from 24 captures 2.5 s apart for the warmest gradient with no plane edge in a corner. Only the capture hides the nav, eyebrow, form, scroll cue and the wordmark's blurred glow (headless Chrome draws it as banded rings), centres the block and enlarges the line so it reads at thumbnail size. To redo it: `scripts/capture-og.mjs` (the recipe is in its header).

