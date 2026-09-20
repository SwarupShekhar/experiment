"use client";
export interface RunPayload {
  mode: "solo" | "party";
  cond: object;
  archetype: string;
  corruption: number;
  pct: object;
  answers: Record<string, unknown>;
  durationMs: number;
  order?: number;
}
function token() { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join(""); }

export async function submitRun(p: RunPayload): Promise<{ id: string; stored: boolean; stats: { n: number; corruptionPercentile?: number } } | null> {
  try {
    const id = crypto.randomUUID(), del = token();
    const r = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...p, id, deleteToken: del }) });
    if (!r.ok) return null;
    const j = await r.json();
    if (j.stored) { try { localStorage.setItem("b9_run_" + id, del); } catch {} }
    return { id, stored: !!j.stored, stats: j.stats };
  } catch { return null; }
}
export async function removeRun(id: string) {
  try {
    const del = localStorage.getItem("b9_run_" + id); if (!del) return false;
    const r = await fetch("/api/runs", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, deleteToken: del }) });
    if (r.ok) localStorage.removeItem("b9_run_" + id);
    return r.ok;
  } catch { return false; }
}
