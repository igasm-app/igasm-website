import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { useFrame, useThree } from "@react-three/fiber";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/**
 * Standalone render of ONLY the website's exact warm gradient, for embedding in
 * the APP via an offline WebView. Same engine + identical params as
 * src/components/Background.jsx, so the app background is byte-identical to
 * igasm.in. Built to one self-contained HTML by vite.gradient.config.js.
 *
 * The moving warm gradient is FOUNDER-LOCKED. These params must stay in lockstep
 * with Background.jsx. Do not change either without changing both.
 *
 * What this page adds around it is cost only, never look (app repo docs/TECH.md, "Gradient
 * performance"): the frame governor in gradient.html (30 fps, pause with no jump, a cheaper GL context)
 * and the build-time shader trims in vite.gradient.config.js.
 */

// Test hook, inert unless window.__igFreezeT is a number (gradient.html sets it from ?freeze=<s>): pins the
// shader's time so a frame can be captured and compared pixel for pixel. Runs after the gradient's own
// time update (priority 0) and before the composer draws (priority 1).
function FreezeHook() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    const t = window.__igFreezeT;
    if (typeof t !== "number" || !Number.isFinite(t)) return;
    scene.traverse((o) => {
      const u = o.material && o.material.userData && o.material.userData.uTime;
      if (u) u.value = t;
    });
  }, 0.5);
  return null;
}

function GradientOnly() {
  return (
    <Suspense fallback={null}>
      <ShaderGradientCanvas
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        pixelDensity={1}
        fov={38}
      >
        <ShaderGradient
          control="props"
          animate="on"
          type="waterPlane"
          uSpeed={0.16}
          uStrength={1.5}
          uDensity={1.3}
          uFrequency={5.5}
          uAmplitude={0}
          color1="#2A1018"
          color2="#7A1E4B"
          color3="#E8985E"
          grain="on"
          reflection={0.1}
          brightness={1.05}
          cAzimuthAngle={180}
          cPolarAngle={80}
          cDistance={3.4}
          cameraZoom={1}
          lightType="3d"
          envPreset="dawn"
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={50}
          rotationY={0}
          rotationZ={-60}
        />
        <FreezeHook />
      </ShaderGradientCanvas>
    </Suspense>
  );
}

createRoot(document.getElementById("root")).render(<GradientOnly />);
