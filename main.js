/* =========================================================================
   igasm - coming soon. Warm, intimate, richly animated.
   Warm grained WebGL field + GSAP/Lenis motion + the light-reveal wordmark.
   Degrades to a still, warm, fully-readable page (JS off / reduced motion).
   ========================================================================= */

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const FORM_ENDPOINT = ""; // set to your endpoint; empty = demo

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const gsap = window.gsap;
const hasGsap = !!gsap;

/* =========================================================================
   1. Warm grained WebGL background (raw WebGL, lazy, gated, warm-only)
   ========================================================================= */
function initBackground() {
  const canvas = $(".bg-gl");
  if (!canvas || reduce) return;
  let gl;
  try {
    gl = canvas.getContext("webgl", { antialias: false, alpha: true, powerPreference: "low-power" });
  } catch (_) {}
  if (!gl) return;

  const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`;
  const fs = `
  precision highp float;
  uniform vec2 u_res; uniform float u_time;
  // value noise + fbm
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
    vec2 u=f*f*(3.-2.*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v=0., a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; }
    return v;
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 1.6;
    float t = u_time * 0.045;
    // two-level domain warp (flowing silk), opposite drifts
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t*0.8)));
    vec2 r = vec2(fbm(p + 2.0*q + vec2(1.7, -t*0.6)), fbm(p + 2.0*q + vec2(8.3, t*0.5)));
    float f = fbm(p + 2.2*r);
    f = pow(clamp(f, 0.0, 1.0), 1.6); // sharpen zones
    // warm 5-stop ramp (plum -> wine -> clay -> amber -> rose), linear-ish
    vec3 c0=vec3(0.16,0.06,0.09);
    vec3 c1=vec3(0.29,0.06,0.15);
    vec3 c2=vec3(0.53,0.30,0.26);
    vec3 c3=vec3(0.91,0.60,0.37);
    vec3 c4=vec3(0.88,0.54,0.63);
    vec3 col = mix(c0,c1,smoothstep(0.0,0.35,f));
    col = mix(col,c2,smoothstep(0.32,0.6,f));
    col = mix(col,c3,smoothstep(0.6,0.82,f));
    col = mix(col,c4,smoothstep(0.82,1.0,f));
    // asymmetric candlelight from lower-left
    float cl = 1.0 - distance(uv, vec2(0.24, 0.92));
    col += vec3(0.32,0.16,0.08) * pow(clamp(cl,0.0,1.0), 2.2);
    // keep it dark enough for cream text
    col *= 0.62;
    // film grain
    float g = hash(uv*u_res.xy*0.5 + fract(u_time)) - 0.5;
    col += g * 0.035;
    gl_FragColor = vec4(col, 1.0);
  }`;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const vsh = sh(gl.VERTEX_SHADER, vs);
  const fsh = sh(gl.FRAGMENT_SHADER, fs);
  if (!vsh || !fsh) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");

  const dpr = Math.min(1.5, window.devicePixelRatio || 1);
  function resize() {
    const w = Math.floor(innerWidth * dpr * 0.7); // render lower-res, grain hides it
    const h = Math.floor(innerHeight * dpr * 0.7);
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  resize();
  addEventListener("resize", resize, { passive: true });

  let visible = true;
  new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0 }).observe(canvas);
  const start = performance.now();
  function frame(now) {
    if (visible && !document.hidden) {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  requestAnimationFrame(() => canvas.classList.add("on"));
}

/* =========================================================================
   2. The light-reveal wordmark + warm cursor glow
   ========================================================================= */
function initLight() {
  const wrap = $(".wordmark-wrap");
  const glow = $(".cursor-glow");
  if (!wrap || reduce) return;

  const L = { x: 50, y: 42 };
  const G = { x: innerWidth * 0.5, y: innerHeight * 0.42 };
  const apply = () => {
    wrap.style.setProperty("--x", L.x.toFixed(2) + "%");
    wrap.style.setProperty("--y", L.y.toFixed(2) + "%");
    if (glow) glow.style.transform = `translate3d(${G.x.toFixed(1)}px, ${G.y.toFixed(1)}px, 0)`;
  };

  if (hasGsap) {
    const qx = gsap.quickTo(L, "x", { duration: 0.5, ease: "sine.out" });
    const qy = gsap.quickTo(L, "y", { duration: 0.5, ease: "sine.out" });
    const gx = gsap.quickTo(G, "x", { duration: 0.6, ease: "sine.out" });
    const gy = gsap.quickTo(G, "y", { duration: 0.6, ease: "sine.out" });
    gsap.ticker.add(apply);

    // idle auto-sweep timeline (paused while the cursor drives)
    const sweep = gsap.timeline({ repeat: -1, yoyo: true })
      .to(L, { x: 70, y: 46, duration: 4, ease: "sine.inOut" })
      .to(L, { x: 30, y: 38, duration: 4, ease: "sine.inOut" });
    if (!fine) {
      if (glow) gsap.to(glow, { opacity: 0.7, duration: 1.2 });
    } else {
      let idle;
      if (glow) gsap.to(glow, { opacity: 1, duration: 1.2 });
      addEventListener(
        "pointermove",
        (e) => {
          sweep.pause();
          const b = wrap.getBoundingClientRect();
          qx(clamp(((e.clientX - b.left) / b.width) * 100, -10, 110));
          qy(clamp(((e.clientY - b.top) / b.height) * 100, -20, 120));
          gx(e.clientX);
          gy(e.clientY);
          clearTimeout(idle);
          idle = setTimeout(() => sweep.resume(), 2600);
        },
        { passive: true },
      );
    }
  } else {
    apply();
  }
}

/* =========================================================================
   3. GSAP scroll: Lenis + reveals + pinned beats + cycle ring
   ========================================================================= */
function initScroll() {
  if (!hasGsap || reduce) {
    // simple IO reveal fallback
    if (!reduce) {
      const io = new IntersectionObserver(
        (es, o) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), o.unobserve(e.target))),
        { threshold: 0.15 },
      );
      $$(".reveal").forEach((el) => io.observe(el));
    }
    drawRingStatic();
    return;
  }
  gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;

  // Lenis smooth scroll on fine pointers
  let lenis = null;
  if (window.Lenis && fine) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    window.lenis = lenis;
    document.documentElement.classList.add("lenis");
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // staggered reveals
  ST.batch(".reveal", {
    start: "top 86%",
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
  gsap.set(".reveal", { opacity: 0, y: 24 });

  // pinned 3-beat scene (desktop only)
  const promise = $(".promise");
  const beats = $$(".beat");
  const dots = $$(".beats-progress i");
  if (promise && beats.length === 3 && innerWidth > 860) {
    promise.classList.add("enhanced");
    let active = -1;
    const setBeat = (i) => {
      if (i === active) return;
      active = i;
      beats.forEach((b, k) => b.classList.toggle("is-active", k === i));
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    };
    setBeat(0);
    ST.create({
      trigger: promise,
      start: "top top",
      end: "+=220%",
      pin: ".promise-pin",
      scrub: true,
      onUpdate: (self) => setBeat(self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2),
    });
  }

  // cycle ring draw-on
  initRing(ST);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
  setTimeout(() => ST.refresh(), 600);
}

function ringGeom() {
  const arc = $(".ring-arc");
  const dot = $(".ring-dot");
  if (!arc) return null;
  const r = 160,
    C = 2 * Math.PI * r;
  arc.style.strokeDasharray = C;
  arc.style.transform = "rotate(-90deg)";
  arc.style.transformOrigin = "210px 210px";
  return { arc, dot, C, r };
}
function drawRingStatic() {
  const g = ringGeom();
  if (g) g.arc.style.strokeDashoffset = "0";
}
function initRing(ST) {
  const g = ringGeom();
  if (!g) return;
  g.arc.style.strokeDashoffset = g.C;
  ST.create({
    trigger: ".insight",
    start: "top 72%",
    onEnter: () => gsap.to(g.arc, { strokeDashoffset: 0, duration: 1.8, ease: "power2.out" }),
  });
}

/* =========================================================================
   4. Waitlist
   ========================================================================= */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function setNote(note, msg, cls) {
  if (!note) return;
  note.textContent = msg;
  note.className = "form-note show" + (cls ? " " + cls : "");
}
function initForm() {
  $$(".waitlist").forEach(wireForm);
}
function wireForm(form) {
  const note = form.querySelector(".form-note");
  const field = form.querySelector(".field");
  const input = form.querySelector("input");
  const btn = form.querySelector("button");
  let busy = false;
  if (localStorage.getItem("igasm_waitlist") === "1") {
    if (field) field.style.display = "none";
    setNote(note, "You are already on the list. See you soon.", "ok");
    return;
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;
    const email = input.value.trim();
    if (!isEmail(email)) {
      input.setAttribute("aria-invalid", "true");
      setNote(note, "Please enter a valid email.", "err");
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    busy = true;
    btn.disabled = true;
    btn.style.opacity = "0.6";
    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email, source: "coming-soon" }),
        });
        if (!res.ok) throw new Error("bad");
      } else {
        await new Promise((r) => setTimeout(r, 550));
      }
      try {
        localStorage.setItem("igasm_waitlist", "1");
      } catch (_) {}
      if (field) {
        field.style.transition = "opacity .5s ease, transform .5s ease";
        field.style.opacity = "0";
        field.style.transform = "scale(0.98)";
        setTimeout(() => (field.style.display = "none"), 480);
      }
      setNote(note, "You are on the list. Your invitation arrives before the door opens.", "ok");
    } catch (_) {
      busy = false;
      btn.disabled = false;
      btn.style.opacity = "";
      setNote(note, "Something went wrong. Please try again.", "err");
    }
  });
}

/* =========================================================================
   boot
   ========================================================================= */
initBackground();
initLight();
initScroll();
initForm();
