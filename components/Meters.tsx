"use client";
import { useEffect, useRef, useState } from "react";
import type { Meters } from "@/lib/game/types";

const LABELS: [keyof Meters, string, string][] = [["order", "Order", "var(--amber)"], ["standing", "Warden", "var(--steel)"], ["morale", "Morale", "var(--orange)"]];

export default function MeterHud({ m }: { m: Meters }) {
  const prev = useRef(m);
  const [delta, setDelta] = useState<Partial<Record<keyof Meters, number>>>({});
  useEffect(() => {
    const d: Partial<Record<keyof Meters, number>> = {};
    (Object.keys(m) as (keyof Meters)[]).forEach((k) => { const x = m[k] - prev.current[k]; if (x) d[k] = x; });
    prev.current = m;
    if (Object.keys(d).length) { setDelta(d); const t = setTimeout(() => setDelta({}), 1800); return () => clearTimeout(t); }
  }, [m]);
  return (
    <div className="hud" aria-label="Shift meters">
      {LABELS.map(([k, l, c]) => (
        <div key={k} className="hud-m">
          <div className="hud-top"><span>{l}</span><b>{m[k]}{delta[k] ? <em className={delta[k]! > 0 ? "up" : "down"}>{delta[k]! > 0 ? "+" : ""}{delta[k]}</em> : null}</b></div>
          <div className="hud-bar"><i style={{ width: `${m[k]}%`, background: c }} />{k === "order" && <span className="hud-target" style={{ left: "80%" }} />}</div>
        </div>
      ))}
    </div>
  );
}
