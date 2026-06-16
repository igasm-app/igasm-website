import { Suspense } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/**
 * The warm living gradient the founder loves, now a real 3D animated field
 * (ShaderGradient / react-three-fiber), tuned to the app's plum -> wine -> amber
 * candlelight ramp. The CSS .bg-fallback sits behind it, so if WebGL is
 * unavailable the warm gradient still shows.
 */
export default function Background() {
  return (
    <Suspense fallback={null}>
      <ShaderGradientCanvas
        className="bg-shader"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: -2, pointerEvents: "none" }}
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
