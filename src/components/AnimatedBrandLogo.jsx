import { BRAND_LOGO_SRC } from "../constants/appConfig.js";
import { zIndex } from "../theme/tokens.js";

export function AnimatedBrandLogo({ dockedInHeader }) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt="aidiff"
      decoding="async"
      aria-hidden
      style={{
        position: "fixed",
        zIndex: zIndex.logo,
        pointerEvents: "none",
        left: dockedInHeader ? 24 : "50%",
        top: dockedInHeader ? 12 : "50%",
        height: dockedInHeader ? 30 : "clamp(76px, 20vw, 118px)",
        width: "auto",
        transform: dockedInHeader ? "translate(0, 0) scale(1)" : "translate(-50%, calc(-100% - 112px)) scale(1)",
        transformOrigin: "top left",
        transition:
          "left 520ms cubic-bezier(0.2, 0.8, 0.2, 1), top 520ms cubic-bezier(0.2, 0.8, 0.2, 1), height 520ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 520ms cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    />
  );
}
