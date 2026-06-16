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

export default function App() {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);

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

      /* ---- Lenis smooth scroll (fine pointer) ---- */
      let lenis = null;
      if (fine && !reduce) {
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
        document.documentElement.classList.add("lenis");
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
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

      /* ---- cycle ring draw-on ---- */
      const arc = document.querySelector(".ring-arc");
      if (arc) {
        const r = 160,
          C = 2 * Math.PI * r;
        arc.style.strokeDasharray = C;
        arc.style.transform = "rotate(-90deg)";
        arc.style.transformOrigin = "210px 210px";
        if (reduce) {
          arc.style.strokeDashoffset = "0";
        } else {
          arc.style.strokeDashoffset = C;
          ScrollTrigger.create({
            trigger: ".insight",
            start: "top 72%",
            onEnter: () => gsap.to(arc, { strokeDashoffset: 0, duration: 1.8, ease: "power2.out" }),
          });
        }
      }

      /* ---- nav active-section tracking ---- */
      ["idea", "cycle", "private", "join"].forEach((id) => {
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

    /* ---- waitlist forms ---- */
    const wired = [];
    document.querySelectorAll(".waitlist").forEach((form) => {
      const note = form.querySelector(".form-note");
      const field = form.querySelector(".field");
      const input = form.querySelector("input");
      const btn = form.querySelector("button");
      let busy = false;
      const setNote = (msg, cls) => {
        if (!note) return;
        note.textContent = msg;
        note.className = "form-note show" + (cls ? " " + cls : "");
      };
      if (localStorage.getItem("igasm_waitlist") === "1") {
        if (field) field.style.display = "none";
        setNote("You are already on the list. See you soon.", "ok");
        return;
      }
      const onSubmit = async (e) => {
        e.preventDefault();
        if (busy) return;
        const email = input.value.trim();
        if (!isEmail(email)) {
          input.setAttribute("aria-invalid", "true");
          setNote("Please enter a valid email.", "err");
          input.focus();
          return;
        }
        input.removeAttribute("aria-invalid");
        busy = true;
        btn.disabled = true;
        btn.style.opacity = "0.6";
        try {
          await new Promise((r) => setTimeout(r, 550)); // demo mode; wire endpoint later
          try {
            localStorage.setItem("igasm_waitlist", "1");
          } catch (_) {}
          if (field) {
            field.style.transition = "opacity .5s ease";
            field.style.opacity = "0";
            setTimeout(() => (field.style.display = "none"), 480);
          }
          setNote("You are on the list. Your invitation arrives before the door opens.", "ok");
        } catch (_) {
          busy = false;
          btn.disabled = false;
          btn.style.opacity = "";
          setNote("Something went wrong. Please try again.", "err");
        }
      };
      form.addEventListener("submit", onSubmit);
      wired.push([form, onSubmit]);
    });

    return () => {
      ctx.revert();
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
            igasm<sup>&reg;</sup>
          </a>
          <nav className="index" aria-label="Sections">
            <a href="#idea" data-cursor><i>01</i> The idea</a>
            <a href="#cycle" data-cursor><i>02</i> The cycle</a>
            <a href="#private" data-cursor><i>03</i> Private</a>
            <a href="#join" data-cursor><i>04</i> Join</a>
          </nav>
          <a href="#join" className="nav-cta" data-cursor>Get early access</a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <p className="hero-eyebrow">
            <span className="live"><i /> Waitlist open</span> <span className="d">/</span> coming soon to iOS + Android
          </p>
          <div className="wordmark-wrap">
            <h1 className="wordmark" aria-label="igasm">
              <span className="wm-base" aria-hidden="true">igasm</span>
              <span className="wm-lit" aria-hidden="true">igasm</span>
            </h1>
            <span className="wm-glow" aria-hidden="true" />
          </div>
          <p className="hero-sub">Your intimacy and your cycle, finally read together.</p>
          <form className="waitlist hero-form" aria-label="Join the waitlist">
            <label className="sr-only" htmlFor="email-hero">Your email address</label>
            <div className="field">
              <input id="email-hero" type="email" name="email" inputMode="email" autoComplete="email" required placeholder="you@email.com" aria-describedby="note-hero" />
              <button type="submit" className="cta" data-cursor><span>Get early access</span><span className="arr">&rarr;</span></button>
            </div>
            <p className="form-note" id="note-hero" role="status" aria-live="polite" />
          </form>
          <a className="scroll-cue" href="#idea" data-cursor><span>Scroll</span><span className="cue-line" /></a>
        </section>

        {/* 01 THE IDEA */}
        <section className="block" id="idea">
          <header className="block-head"><span className="num">01</span><span className="lbl">The idea</span></header>
          <div className="block-body">
            <h2 className="big reveal">Most apps know your calendar. None of them know your wanting.</h2>
            <p className="sub reveal">We built the one that reads both, in private, for solo, couples and consenting groups.</p>
            <ol className="steps">
              <li className="step reveal"><span className="step-n">01</span><h3 className="step-h">Track what you feel</h3><p className="step-b">Desire, mood, energy, who you were with. The honest details, logged in seconds.</p></li>
              <li className="step reveal"><span className="step-n">02</span><h3 className="step-h">See your rhythm</h3><p className="step-b">A menstrual-cycle tracker that learns your phases and patterns over time.</p></li>
              <li className="step reveal"><span className="step-n">03</span><h3 className="step-h">Understand the two</h3><p className="step-b">Cycle-aware insight into how your phase shapes your desire. The part no one else shows you.</p></li>
            </ol>
          </div>
        </section>

        {/* 02 THE CYCLE */}
        <section className="block insight" id="cycle">
          <header className="block-head"><span className="num">02</span><span className="lbl">The cycle</span></header>
          <div className="block-body insight-body">
            <div className="insight-copy">
              <h2 className="big reveal">Your desire has a rhythm. We help you read it.</h2>
              <p className="sub reveal">Four phases, one rhythm, drawn in your own private light. A typical cycle, shown for illustration.</p>
              <ul className="phase-legend reveal">
                <li><span className="swatch" style={{ "--c": "var(--menstrual)" }} /> Menstrual</li>
                <li><span className="swatch" style={{ "--c": "var(--follicular)" }} /> Follicular</li>
                <li><span className="swatch" style={{ "--c": "var(--ovulatory)" }} /> Ovulatory</li>
                <li><span className="swatch" style={{ "--c": "var(--luteal)" }} /> Luteal</li>
              </ul>
            </div>
            <div className="insight-art reveal">
              <svg className="ring" viewBox="0 0 420 420" role="img" aria-label="Your intimacy and your cycle drawn together as a ring of phases.">
                <defs>
                  <linearGradient id="phaseGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--menstrual)" />
                    <stop offset="34%" stopColor="var(--follicular)" />
                    <stop offset="67%" stopColor="var(--ovulatory)" />
                    <stop offset="100%" stopColor="var(--luteal)" />
                  </linearGradient>
                  <filter id="soften" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2" /></filter>
                </defs>
                <g className="ring-rotate">
                  <circle className="ring-track" cx="210" cy="210" r="160" fill="none" />
                  <circle className="ring-arc" cx="210" cy="210" r="160" fill="none" />
                  <circle className="ring-dot" r="7" cx="210" cy="50" />
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* 03 PRIVATE */}
        <section className="block private" id="private">
          <header className="block-head"><span className="num">03</span><span className="lbl">Private</span></header>
          <div className="block-body">
            <h2 className="big reveal">Private by design, not a promise you have to trust.</h2>
            <ul className="vow">
              <li className="reveal">Encrypted in transit and at rest.</li>
              <li className="reveal">Never sold, never shared with anyone.</li>
              <li className="reveal">No third-party ad or analytics on your intimate data.</li>
              <li className="reveal">Yours to export or delete, anytime.</li>
            </ul>
          </div>
        </section>

        {/* 04 JOIN */}
        <section className="block join" id="join">
          <header className="block-head"><span className="num">04</span><span className="lbl">Join</span></header>
          <div className="block-body">
            <h2 className="big reveal">Be first in.</h2>
            <p className="sub reveal">Your invitation arrives before the door opens.</p>
            <form className="waitlist reveal" aria-label="Join the waitlist">
              <label className="sr-only" htmlFor="email-join">Your email address</label>
              <div className="field">
                <input id="email-join" type="email" name="email" inputMode="email" autoComplete="email" required placeholder="you@email.com" aria-describedby="note-join" />
                <button type="submit" className="cta" data-cursor><span>Get early access</span><span className="arr">&rarr;</span></button>
              </div>
              <p className="form-note" id="note-join" role="status" aria-live="polite" />
            </form>
            <p className="trust reveal">Private by design <span className="d">/</span> 17+ <span className="d">/</span> no spam, leave anytime</p>
          </div>
        </section>
      </main>

      {!reduce && (
        <Safe>
          <Suspense fallback={null}>
            <LiquidSeam />
          </Suspense>
        </Safe>
      )}

      <footer className="foot">
        <div className="foot-top">
          <span className="foot-mark">igasm</span>
          <p className="foot-line">A private companion for your intimacy and your cycle. Coming soon to iOS and Android.</p>
        </div>
        <div className="foot-base">
          <a href="https://igasm.in" data-cursor>igasm.in</a>
          <a href="mailto:admin@igasm.in" data-cursor>admin@igasm.in</a>
          <span>Informational wellness for 17+. Encrypted, never sold.</span>
          <span>&copy; 2026 igasm</span>
        </div>
      </footer>
    </div>
  );
}
