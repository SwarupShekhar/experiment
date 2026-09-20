import { ImageResponse } from "next/og";
import { ARCHETYPES } from "@/lib/game/engine";
export const runtime = "edge";

const display = fetch(new URL("../../../assets/fonts/bsd-900.woff", import.meta.url)).then((r) => r.arrayBuffer());
const body = fetch(new URL("../../../assets/fonts/ah-400.woff", import.meta.url)).then((r) => r.arrayBuffer());

export async function GET(req: Request) {
  const u = new URL(req.url);
  const a = ARCHETYPES[u.searchParams.get("a") || ""];
  const c = Number(u.searchParams.get("c"));
  const hasC = Number.isFinite(c) && u.searchParams.get("c") !== null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 70, background: "#101110", color: "#f3efe6", fontFamily: "Body" }}>
        <div style={{ fontSize: 40, color: "#f2a93b", letterSpacing: 4, fontFamily: "Display" }}>BLOCK 9 · CASE FILE</div>
        <div style={{ display: "flex", marginTop: 24 }}>
          <div style={{ display: "flex", fontSize: 120, fontWeight: 900, fontFamily: "Display", color: "#e5484d", border: "8px solid #e5484d", padding: "4px 24px", transform: "rotate(-2deg)" }}>{(a?.title || "One night shift").toUpperCase()}</div>
        </div>
        {hasC && <div style={{ fontSize: 44, marginTop: 30, display: "flex" }}>{`Corruption index: ${Math.max(0, Math.min(100, Math.round(c)))}/100`}</div>}
        <div style={{ fontSize: 36, color: "#c9c2b3", marginTop: 16 }}>{a?.line || "How far would you go?"}</div>
        <div style={{ fontSize: 30, color: "#f2a93b", marginTop: 30 }}>How far would you go? Play free »</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: [{ name: "Display", data: await display, weight: 900 }, { name: "Body", data: await body, weight: 400 }] },
  );
}
