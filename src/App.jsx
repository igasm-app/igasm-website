import { Component, Suspense, lazy, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Code-split the heavy WebGL bundles so the warm CSS gradient + content paint
// instantly; the shaders stream in after.
const Background = lazy(() => import("./components/Background.jsx"));
const LiquidSeam = lazy(() => import("./components/LiquidSeam.jsx"));

/* Any WebGL/shader failure falls back silently to the warm CSS layer instead
   of blanking the page. */
class Safe extends Component {
  constructor(p) {
    super(p);
    this.state = { ok: true };
  }
  static getDerivedStateFromError() {
    return { ok: false };
  }
  componentDidCatch() {}
  render() {
    return this.state.ok ? this.props.children : null;
  }
}

const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = typeof matchMedia !== "undefined" && matchMedia("(hover: hover) and (pointer: fine)").matches;
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Store a signup through the locked-down join_waitlist RPC. This is the ONLY thing the
// public key can do - it validates + dedupes server-side and can never read the list back.
async function postWaitlist(email, source) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("waitlist endpoint not configured");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/join_waitlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_email: email,
      p_source: source || null,
      p_referrer: (typeof document !== "undefined" && document.referrer) || null,
    }),
  });
  if (!res.ok) throw new Error(`waitlist ${res.status}`);
  return true;
}

export default function App() {
  const root = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    /* ---- Lenis smooth scroll (desktop only) + grain-freeze-on-scroll (all devices) ---- */
    let lenis = null;
    let rafCb = null;
    if (fine && !reduce) {
      lenis = new Lenis({
        lerp: 0.09, // award-site sweet spot (0.08-0.10): heavy, expensive glide
        smoothWheel: true,
        syncTouch: false, // native momentum on touch beats any JS emulation
        wheelMultiplier: 1,
        gestureOrientation: "vertical",
        overscroll: true,
        autoRaf: false, // ONE RAF loop only, driven by the GSAP ticker below
      });
      document.documentElement.classList.add("lenis");
      lenis.on("scroll", ScrollTrigger.update);
      rafCb = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(rafCb);
      gsap.ticker.lagSmoothing(0); // never "catch up" - prevents jumpy scroll on a busy frame
    }
    // (The film grain is now static CSS, so there is no animation to freeze. Toggling a class on
    // the full-screen mix-blend layer on every scroll frame was itself a jank source - removed.)

    const ctx = gsap.context(() => {
      /* ---- light-reveal wordmark + warm cursor glow ---- */
      const wrap = document.querySelector(".wordmark-wrap");
      const glow = document.querySelector(".cursor-glow");
      if (wrap && !reduce) {
        const L = { x: 50, y: 42 };
        const G = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 };
        const apply = () => {
          wrap.style.setProperty("--x", L.x.toFixed(2) + "%");
          wrap.style.setProperty("--y", L.y.toFixed(2) + "%");
          if (glow) glow.style.transform = `translate3d(${G.x.toFixed(1)}px, ${G.y.toFixed(1)}px, 0)`;
        };
        const qx = gsap.quickTo(L, "x", { duration: 0.5, ease: "sine.out" });
        const qy = gsap.quickTo(L, "y", { duration: 0.5, ease: "sine.out" });
        const gx = gsap.quickTo(G, "x", { duration: 0.6, ease: "sine.out" });
        const gy = gsap.quickTo(G, "y", { duration: 0.6, ease: "sine.out" });
        gsap.ticker.add(apply);
        const sweep = gsap
          .timeline({ repeat: -1, yoyo: true })
          .to(L, { x: 70, y: 46, duration: 4, ease: "sine.inOut" })
          .to(L, { x: 30, y: 38, duration: 4, ease: "sine.inOut" });
        if (glow) gsap.to(glow, { opacity: fine ? 1 : 0.7, duration: 1.2 });
        if (fine) {
          let idle;
          const onMove = (e) => {
            sweep.pause();
            const b = wrap.getBoundingClientRect();
            qx(gsap.utils.clamp(-10, 110, ((e.clientX - b.left) / b.width) * 100));
            qy(gsap.utils.clamp(-20, 120, ((e.clientY - b.top) / b.height) * 100));
            gx(e.clientX);
            gy(e.clientY);
            clearTimeout(idle);
            idle = setTimeout(() => sweep.resume(), 2600);
          };
          window.addEventListener("pointermove", onMove, { passive: true });
        }
      }

      /* ---- reveals ---- */
      if (!reduce) {
        gsap.set(".reveal", { opacity: 0, y: 24 });
        ScrollTrigger.batch(".reveal", {
          start: "top 86%",
          onEnter: (els) =>
            gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
        });
      }

      /* ---- hero entrance ---- */
      if (!reduce) {
        gsap.from(".hero-eyebrow, .wordmark-wrap, .hero-sub, .hero-form, .scroll-cue", {
          opacity: 0,
          y: 26,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.1,
        });
      }

      /* ---- nav active-section tracking ---- */
      ["idea", "everyone", "cycle", "private", "join"].forEach((id) => {
        const sec = document.getElementById(id);
        const link = document.querySelector(`.index a[href="#${id}"]`);
        if (!sec || !link) return;
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => link.classList.toggle("is-active", self.isActive),
        });
      });

      /* ---- magnetic CTAs (fine pointer) ---- */
      if (fine && !reduce) {
        document.querySelectorAll(".cta, .nav-cta").forEach((btn) => {
          const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
          const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
          btn.addEventListener("pointermove", (e) => {
            const r = btn.getBoundingClientRect();
            xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
            yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
          });
          btn.addEventListener("pointerleave", () => {
            xTo(0);
            yTo(0);
          });
        });
      }

      ScrollTrigger.refresh();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }, root);

    /* ---- waitlist forms (store via the locked join_waitlist RPC) ---- */
    const wired = [];
    document.querySelectorAll(".waitlist").forEach((form) => {
      const note = form.querySelector(".form-note");
      const field = form.querySelector(".field");
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector("button");
      const honey = form.querySelector(".hp-field"); // bot honeypot
      const source = form.getAttribute("data-source") || "site";
      let busy = false;
      const setNote = (msg, cls) => {
        if (!note) return;
        note.textContent = msg;
        note.className = "form-note show" + (cls ? " " + cls : "");
      };
      // Deliberately NO localStorage hide: on a fresh visit/refresh the field is always
      // there. Success is shown for the current visit only.
      const onSubmit = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (honey && honey.value) {
          // a bot filled the hidden trap; show success, send nothing
          if (field) field.style.display = "none";
          setNote("You are in. Your invitation arrives before the door opens.", "ok");
          return;
        }
        const email = input.value.trim();
        if (!isEmail(email)) {
          input.setAttribute("aria-invalid", "true");
          setNote("That email looks off. Mind checking it has an @ and a domain?", "err");
          input.focus();
          return;
        }
        input.removeAttribute("aria-invalid");
        busy = true;
        btn.disabled = true;
        btn.style.opacity = "0.6";
        try {
          await postWaitlist(email, source);
          if (field) {
            field.style.transition = "opacity .5s ease";
            field.style.opacity = "0";
            setTimeout(() => {
              field.style.display = "none";
            }, 480);
          }
          setNote("You are in. Your invitation arrives before the door opens.", "ok");
        } catch (_) {
          busy = false;
          btn.disabled = false;
          btn.style.opacity = "";
          setNote("Something went wrong on our end. Please try again in a moment.", "err");
        }
      };
      form.addEventListener("submit", onSubmit);
      wired.push([form, onSubmit]);
    });

    return () => {
      ctx.revert();
      if (rafCb) gsap.ticker.remove(rafCb);
      if (lenis) lenis.destroy();
      wired.forEach(([f, h]) => f.removeEventListener("submit", h));
    };
  }, []);

  return (
    <div ref={root}>
      <div className="bg-fallback" aria-hidden="true" />
      {!reduce && (
        <Safe>
          <Suspense fallback={null}>
            <Background />
          </Suspense>
        </Safe>
      )}
      <div className="cursor-glow" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="nav">
        <div className="nav-inner">
          <a href="#top" className="brand" data-cursor>
            igasm
          </a>
          <nav className="index" aria-label="Sections">
            <a href="#idea" data-cursor><i>01</i> The idea</a>
            <a href="#everyone" data-cursor><i>02</i> For everyone</a>
            <a href="#cycle" data-cursor><i>03</i> The cycle</a>
            <a href="#private" data-cursor><i>04</i> Private</a>
            <a href="#join" data-cursor><i>05</i> Join</a>
          </nav>
          <a href="#join" className="nav-cta" data-cursor>Get early access</a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <div className="hero-lead">
          <p className="hero-eyebrow">
            <span className="live"><i /> Waitlist open</span>
            <span className="d" aria-hidden="true">/</span>
            <span className="eb-rest">coming soon to iOS + Android</span>
          </p>
          <div className="wordmark-wrap">
            <h1 className="wordmark" aria-label="igasm">
              <span className="wm-base" aria-hidden="true">igasm</span>
              <span className="wm-lit" aria-hidden="true">igasm</span>
              <span className="wm-sheen" aria-hidden="true">igasm</span>
            </h1>
            <span className="wm-glow" aria-hidden="true" />
          </div>
          <p className="hero-sub">Your intimacy, <span className="accent">finally understood</span>. Solo, couples, or groups. Every body, every orientation.</p>
          </div>
          <form className="waitlist hero-form" data-source="hero" aria-label="Join the waitlist" noValidate>
            <label className="sr-only" htmlFor="email-hero">Your email address</label>
            <div className="hp-wrap" aria-hidden="true">
              <label htmlFor="hp-hero">Leave this field empty</label>
              <input className="hp-field" id="hp-hero" type="text" name="company" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="field">
              <input id="email-hero" type="email" name="email" inputMode="email" autoComplete="email" placeholder="you@email.com" aria-describedby="note-hero" />
              <button type="submit" className="cta" data-cursor><span>Get early access</span><span className="arr">&rarr;</span></button>
            </div>
            <p className="form-note" id="note-hero" role="status" aria-live="polite" />
          </form>
          <a className="scroll-cue" href="#idea" data-cursor><span>Scroll</span><span className="cue-line" /></a>
        </section>

        {/* liquid-metal seam leaving the hero - bookends the one above the footer */}
        {!reduce && (
          <div className="seam-wrap" aria-hidden="true">
            <Safe>
              <Suspense fallback={null}>
                <LiquidSeam className="liquid-seam liquid-seam-top" />
              </Suspense>
            </Safe>
          </div>
        )}

        {/* 01 THE IDEA - a ledger on a hairline spine */}
        <section className="block block--idea" id="idea">
          <div className="idea-col">
            <header className="idea-index reveal"><span className="num">01</span><span className="d">/</span><span className="lbl">The idea</span></header>
            <h2 className="big idea-head reveal">Most apps know your calendar. None of them know your wanting.</h2>
            <p className="lead reveal">We made the one that reads your whole intimate life, and keeps it yours. For every body, and every kind of closeness.</p>
            <ol className="moves">
              <li className="move reveal"><span className="move-n" aria-hidden="true">01</span><div className="move-body"><h3 className="move-h">Track what you feel</h3><p className="move-b">Desire, mood, energy, who you were with. The honest details, logged in seconds.</p></div></li>
              <li className="move reveal"><span className="move-n" aria-hidden="true">02</span><div className="move-body"><h3 className="move-h">See your patterns</h3><p className="move-b">How your desire, arousal and satisfaction move over time, and what actually shifts them.</p></div></li>
              <li className="move reveal"><span className="move-n" aria-hidden="true">03</span><div className="move-body"><h3 className="move-h">Connect your cycle</h3><p className="move-b">If you menstruate, watch your phase shape your wanting. <span className="accent">The part no one else shows you.</span></p></div></li>
            </ol>
          </div>
        </section>

        {/* 02 FOR EVERYONE */}
        <section className="block everyone" id="everyone">
          <header className="block-head"><span className="num">02</span><span className="lbl">For everyone</span></header>
          <div className="block-body">
            <h2 className="big reveal">Made for every body, and every kind of closeness.</h2>
            <p className="sub reveal">Whoever you are, however you love, alone or together. igasm never assumes a default person.</p>
            <ul className="mode-list">
              <li className="reveal"><span className="mode-name">Solo</span><span className="mode-line">Just you. Your patterns, your pleasure, your private record.</span></li>
              <li className="reveal"><span className="mode-name">Couples</span><span className="mode-line">You and a partner, in one shared and consenting space.</span></li>
              <li className="reveal"><span className="mode-name">Groups</span><span className="mode-line">Throuples and more. Whatever your circle looks like, with everyone's consent.</span></li>
            </ul>
            <p className="sub reveal everyone-close">Every gender. Every orientation. No one here is the default.</p>
          </div>
        </section>

        {/* 03 THE CYCLE */}
        <section className="block insight" id="cycle">
          <header className="block-head"><span className="num">03</span><span className="lbl">The cycle</span></header>
          <div className="block-body">
            <h2 className="big reveal">Your desire has a rhythm. We help you read it.</h2>
            <p className="sub reveal">If you menstruate, your cycle is one quiet lens on how wanting moves through a month. Four phases, read in private, on your terms.</p>
            <ul className="phases reveal">
              <li className="phase"><span className="phase-name">Menstrual</span><span className="phase-read">A slower, inward turn. Rest is allowed.</span></li>
              <li className="phase"><span className="phase-name">Follicular</span><span className="phase-read">Energy returns. Curiosity opens back up.</span></li>
              <li className="phase"><span className="phase-name">Ovulatory</span><span className="phase-read">Often the brightest, most outward stretch.</span></li>
              <li className="phase"><span className="phase-name">Luteal</span><span className="phase-read">Things soften and settle. Closeness over fireworks.</span></li>
            </ul>
            <p className="cycle-close reveal">Not a forecast. A way to recognise yourself.</p>
          </div>
        </section>

        {/* 04 PRIVATE - the one framed glass vault */}
        <section className="block private" id="private">
          <header className="block-head"><span className="num">04</span><span className="lbl">Private</span></header>
          <div className="block-body">
            <h2 className="big reveal">Private by design, <span className="accent">not a promise</span> you have to trust.</h2>
            <div className="vault reveal">
              <ul className="vault-grid">
                <li className="vow-row"><span className="vow-n" aria-hidden="true">01</span><h3 className="vow-h">Encrypted the whole way</h3><p className="vow-b">Sealed in transit and at rest, so it is unreadable in between.</p></li>
                <li className="vow-row"><span className="vow-n" aria-hidden="true">02</span><h3 className="vow-h">Never sold, never shared</h3><p className="vow-b">Not to advertisers, not to anyone. There is no version of this where we sell you.</p></li>
                <li className="vow-row"><span className="vow-n" aria-hidden="true">03</span><h3 className="vow-h">No trackers on intimate data</h3><p className="vow-b">Zero third-party ad or analytics SDKs touch what you log here.</p></li>
                <li className="vow-row"><span className="vow-n" aria-hidden="true">04</span><h3 className="vow-h">Yours to take or erase</h3><p className="vow-b">Export everything or delete it for good, the moment you decide, no questions.</p></li>
              </ul>
              <p className="vault-foot">Informational wellness, never a diagnosis. Your record stays yours.</p>
            </div>
          </div>
        </section>

        {/* 05 JOIN - the centered finale (bookends the hero) */}
        <section className="block join block--join" id="join">
          <div className="join-col">
            <header className="join-index reveal"><span className="num">05</span><span className="d">/</span><span className="lbl">Join</span></header>
            <div className="threshold-rule reveal" aria-hidden="true" />
            <h2 className="join-h reveal">Be first in.</h2>
            <p className="sub reveal">Your invitation arrives before the door opens.</p>
            <form className="waitlist reveal" data-source="join" aria-label="Join the waitlist" noValidate>
              <label className="sr-only" htmlFor="email-join">Your email address</label>
              <div className="hp-wrap" aria-hidden="true">
                <label htmlFor="hp-join">Leave this field empty</label>
                <input className="hp-field" id="hp-join" type="text" name="company" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="field">
                <input id="email-join" type="email" name="email" inputMode="email" autoComplete="email" placeholder="you@email.com" aria-describedby="note-join safe-join" />
                <button type="submit" className="cta" data-cursor><span>Get early access</span><span className="arr">&rarr;</span></button>
              </div>
              <p className="form-note" id="note-join" role="status" aria-live="polite" />
              <p className="form-safe reveal" id="safe-join">Just your email, nothing else. Encrypted, never sold, and gone the moment you ask. We are very, very good at keeping secrets :)</p>
            </form>
            <p className="trust reveal">Private by design / encrypted, never sold / leave anytime</p>
          </div>
        </section>
      </main>

      {!reduce && (
        <div className="seam-wrap" aria-hidden="true">
          <Safe>
            <Suspense fallback={null}>
              <LiquidSeam />
            </Suspense>
          </Safe>
        </div>
      )}

      <footer className="foot">
        <div className="foot-top">
          <span className="foot-mark">igasm</span>
          <p className="foot-line">A private companion for your intimacy, for every body. Coming soon to iOS and Android.</p>
        </div>
        <div className="foot-base">
          <a href="https://igasm.in" data-cursor>igasm.in</a>
          <a href="https://www.instagram.com/igasmapp" target="_blank" rel="noopener noreferrer" data-cursor>Instagram</a>
          <a href="mailto:admin@igasm.in" data-cursor>admin@igasm.in</a>
          <span>Informational wellness. Encrypted, never sold.</span>
          <span>igasm by Venex Labs &middot; &copy; 2026</span>
        </div>
      </footer>
    </div>
  );
}
