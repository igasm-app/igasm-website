import { useEffect, useRef, useState } from "react";

/**
 * Mounts its children only while near the viewport, and (unless `once`) unmounts
 * them once they scroll well away - which destroys their WebGL context (Paper's
 * dispose runs on unmount). This is the only reliable way to free contexts on
 * iOS, which hard-caps simultaneous WebGL contexts and silently kills the oldest.
 * The locked background gradient is never gated; only the accent shaders are.
 *
 * - rootMargin: how early to mount (mount slightly before on-screen so the fade
 *   completes before it is centred).
 * - once: mount on first intersection and never unmount (use for the hero, which
 *   is always near the top - avoids re-creating its context on every scroll).
 */
export default function InView({ rootMargin = "250px", once = false, className, children }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShow(false);
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, once]);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {show ? children : null}
    </div>
  );
}
