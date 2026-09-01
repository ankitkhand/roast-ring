import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, color: "#f8f5ed", background: "#111317", fontFamily: "Arial Black, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 28, color: "#bdfb4a", marginBottom: 55 }}>{siteConfig.name.toUpperCase()}</div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 105, lineHeight: .88, letterSpacing: -6 }}><span>YO MAMA</span><span style={{ color: "#bdfb4a" }}>BATTLE.</span></div>
      <div style={{ marginTop: 45, fontSize: 35, fontFamily: "Arial, sans-serif" }}>Think you’re funny? Prove it.</div>
    </div>, size,
  );
}
