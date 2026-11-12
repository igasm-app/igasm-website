import { Component, StrictMode, Suspense, lazy, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { appLink, groups, readFragment } from "./lib/inviteCode.js";
import "./styles.css";
import "./invite.css";

// igasm.in/c#CODE - an invite link. The code lives ONLY in the URL fragment: browsers never send a
// fragment to a server, this page makes no network request with it, logs nothing and loads no
// analytics. Content-free: no names, nothing about the room or the person who sent it.

const Background = lazy(() => import("./components/Background.jsx"));

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

const mm = (q) => typeof matchMedia !== "undefined" && matchMedia(q).matches;
const reduce = mm("(prefers-reduced-motion: reduce)");
const fine = mm("(hover: hover) and (pointer: fine)");

const WHERE = "Open igasm, then Settings, then Enter a code.";

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the old way */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* The founder-locked light-reveal wordmark: a warm light drifts through the letters (and follows a
   fine pointer). Same layers and CSS as the homepage hero; a plain rAF loop instead of GSAP. */
function Wordmark() {
  const wrap = useRef(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el || reduce) return undefined;
    const L = { x: 50, y: 42 };
    let target = null;
    let idle = 0;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      const sx = 50 + 20 * Math.sin((t / 8) * Math.PI);
      const sy = 42 + 4 * Math.sin((t / 8) * Math.PI + 0.6);
      const goal = target && now < idle ? target : { x: sx, y: sy };
      L.x += (goal.x - L.x) * 0.08;
      L.y += (goal.y - L.y) * 0.08;
      el.style.setProperty("--x", L.x.toFixed(2) + "%");
      el.style.setProperty("--y", L.y.toFixed(2) + "%");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e) => {
      const b = el.getBoundingClientRect();
      const clamp = (v, a, z) => Math.min(z, Math.max(a, v));
      target = {
        x: clamp(((e.clientX - b.left) / b.width) * 100, -10, 110),
        y: clamp(((e.clientY - b.top) / b.height) * 100, -20, 120),
      };
      idle = performance.now() + 2600;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);
  return (
    <div className="wordmark-wrap invite-mark" ref={wrap} role="img" aria-label="igasm">
      <span className="wordmark" aria-hidden="true">
        <span className="wm-base">igasm</span>
        <span className="wm-lit">igasm</span>
        <span className="wm-sheen">igasm</span>
      </span>
      <span className="wm-glow" aria-hidden="true" />
    </div>
  );
}

function CodeBlock({ read }) {
  const [copied, setCopied] = useState(null);
  const g = groups(read.code);
  const perRow = read.kind === "invite" ? 2 : g.length;
  const rows = [];
  for (let i = 0; i < g.length; i += perRow) rows.push(g.slice(i, i + perRow));
  const onCopy = async () => {
    setCopied((await copyText(read.code)) ? "Copied" : "Copy did not work here. Select the code and copy it.");
  };
  useEffect(() => {
    if (copied !== "Copied") return undefined;
    const t = setTimeout(() => setCopied(null), 2400);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div className="inv-code-card">
      <p className="inv-label" id="code-label">{read.kind === "room" ? "Room code" : "Invite code"}</p>
      <p className="inv-code" aria-labelledby="code-label" aria-describedby="code-spelled">
        {rows.map((r, i) => (
          <span className="inv-row" key={i}>
            {r.map((s, j) => (
              <span className="inv-group" key={j}>{s}</span>
            ))}
          </span>
        ))}
      </p>
      <span className="sr-only" id="code-spelled">{read.code.toUpperCase().split("").join(" ")}</span>
      <button type="button" className="inv-copy" onClick={onCopy}>
        {copied === "Copied" ? "Copied" : "Copy code"}
      </button>
      <p className="inv-status" role="status" aria-live="polite">{copied && copied !== "Copied" ? copied : copied ? "Code copied" : ""}</p>
    </div>
  );
}

function Invite() {
  const [read, setRead] = useState(() => readFragment(location.hash));
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const onHash = () => setRead(readFragment(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Tapping Open hands the link to the phone. If igasm opened, this page goes to the background;
  // if it is still in front a moment later, igasm is likely not on this phone yet, so say so calmly.
  const onOpen = () => {
    const before = Date.now();
    const timer = setTimeout(() => {
      if (document.visibilityState === "visible" && Date.now() - before < 4000) setTried(true);
    }, 1600);
    const hide = () => {
      if (document.visibilityState === "hidden") clearTimeout(timer);
    };
    document.addEventListener("visibilitychange", hide, { once: true });
  };

  return (
    <>
      <div className="bg-fallback" aria-hidden="true" />
      {!reduce && (
        <Safe>
          <Suspense fallback={null}>
            <Background />
          </Suspense>
        </Safe>
      )}
      <div className="grain" aria-hidden="true" />

      <main className="invite">
        <Wordmark />
        {read ? (
          <>
            <h1 className="inv-head">You have an invite.</h1>
            <p className="inv-sub">Open it in igasm, or enter the code yourself.</p>
            <a className="cta inv-open" href={appLink(read.code)} onClick={onOpen}>
              Open in igasm <span className="arr" aria-hidden="true">&rarr;</span>
            </a>
            <p className="inv-note" role="status" aria-live="polite">
              {tried ? "Nothing opened? igasm may not be on this phone yet. The code below works once it is." : ""}
            </p>
            <div className="inv-or" aria-hidden="true"><span>or enter it yourself</span></div>
            <CodeBlock read={read} />
            <p className="inv-where">{WHERE}</p>
          </>
        ) : (
          <>
            <h1 className="inv-head">This link is missing its code.</h1>
            <p className="inv-sub">Ask for the link again, or ask for the code itself. {WHERE}</p>
          </>
        )}
        <p className="inv-soon">igasm is coming soon to iOS and Android.</p>
        <a className="inv-home" href="/">igasm.in</a>
      </main>
    </>
  );
}

document.documentElement.classList.add("js");
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Invite />
  </StrictMode>,
);
