import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/**
 * Standalone render of ONLY the website's exact warm gradient, for embedding in
 * the APP via an offline WebView. Same engine + identical params as
 * src/components/Background.jsx, so the app background is byte-identical to
 * igasm.in. Built to one self-contained HTML by vite.gradient.config.js.
 *
 * The moving warm gradient is FOUNDER-LOCKED. These params must stay in lockstep
 * with Background.jsx. Do not change either without changing both.
 */
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
      </ShaderGradientCanvas>
    </Suspense>
  );
}

createRoot(document.getElementById("root")).render(<GradientOnly />);
