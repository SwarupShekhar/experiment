import { ImageResponse } from "next/og";
export const runtime = "edge";
export const alt = "Block 9: one night shift. How far would you go?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function OG() {
  const display = await fetch(new URL("../assets/fonts/bsd-900.woff", import.meta.url)).then((r) => r.arrayBuffer());
  const body = await fetch(new URL("../assets/fonts/ah-400.woff", import.meta.url)).then((r) => r.arrayBuffer());
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#101110", color: "#f3efe6", position: "relative", fontFamily: "Display" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", gap: 70, paddingLeft: 60 }}>{Array.from({ length: 14 }).map((_, i) => <div key={i} style={{ width: 16, height: "100%", background: "rgba(242,169,59,0.08)" }} />)}</div>
        <div style={{ fontSize: 36, color: "#f2a93b", letterSpacing: 4 }}>BLOCK 9</div>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, marginTop: 20 }}>One night shift.</div>
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, color: "#f2a93b" }}>How far would you go?</div>
        <div style={{ fontSize: 30, color: "#c9c2b3", marginTop: 30, fontFamily: "Body" }}>A free game inspired by the Stanford Prison Experiment</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Display", data: display, weight: 900 }, { name: "Body", data: body, weight: 400 }] },
  );
}
