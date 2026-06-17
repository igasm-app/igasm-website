// Single source of truth for device capability + per-shader caps.
// Computed once at module load. Decides WebGL-vs-CSS-only and the pixel caps that
// keep several Paper Shaders canvases smooth and cool on phones. Hyphens only.

const mm = (q) => typeof matchMedia !== "undefined" && matchMedia(q).matches;

export const reduceMotion = mm("(prefers-reduced-motion: reduce)");
export const saveData =
  typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData === true;
export const lowMem =
  typeof navigator !== "undefined" && typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
export const lowCpu =
  typeof navigator !== "undefined" &&
  typeof navigator.hardwareConcurrency === "number" &&
  navigator.hardwareConcurrency <= 4;

// coarse pointer + no hover is the best "this is a phone" signal
export const isPhone = mm("(hover: none) and (pointer: coarse)");
export const fine = mm("(hover: hover) and (pointer: fine)");
export const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;

// Hard kill switch: when true, render ZERO webgl and let .bg-fallback (CSS) show.
// deviceMemory / saveData are Chromium-only, so unknown (iOS) stays full-quality but
// still phone-capped via paperCaps; we only fully drop on an EXPLICIT low signal.
export const webglOff = reduceMotion || saveData || lowMem || lowCpu;

// Per-canvas caps for Paper Shaders. Paper silently defaults to minPixelRatio=2
// (supersamples to 2x even on 1x screens) and maxPixelCount ~8.29M, so an uncapped
// full-bleed canvas on a 3x phone shades millions of px/frame. Always override.
export const paperCaps = isPhone
  ? { minPixelRatio: 1, maxPixelCount: 900_000 }
  : { minPixelRatio: 1, maxPixelCount: 2_000_000 };

// FOUNDER-LOCKED: the beloved moving gradient renders at FULL density on EVERY device.
// Never downgraded - colors, motion, sharpness all stay identical everywhere.
export const bgPixelDensity = 1;
