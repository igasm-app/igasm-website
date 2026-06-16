import { LiquidMetal } from "@paper-design/shaders-react";

/**
 * A contained, warm-tinted liquid-metal seam above the footer - the founder's
 * liquid-logo / Paper Shaders engine, used as one restrained signature accent
 * (not the whole page). Masked at the edges so it reads as a seam of warm light.
 */
export default function LiquidSeam() {
  return (
    <div className="liquid-seam" aria-hidden="true">
      <LiquidMetal
        style={{ width: "100%", height: "100%" }}
        colorBack="#00000000"
        colorTint="#E08AA0"
        speed={0.5}
        repetition={3}
        softness={0.4}
        shiftRed={0.25}
        shiftBlue={0.2}
        distortion={0.12}
        contour={0.85}
      />
    </div>
  );
}
