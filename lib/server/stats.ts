import "server-only";
import { db } from "./db";

export interface Row { mode: string; cond: { anon?: boolean; authority?: string; peer?: string }; archetype: string; corruption: number; pct: Record<string, number>; answers: Record<string, { v: unknown }> }

export interface Aggregate {
  n: number;
  updatedAt: string;
  archetypes: Record<string, number>;
  corruptionSorted: number[];
  histogram: number[];
  meanPct: Record<string, number>;
  byCondition: { factor: string; a: { label: string; n: number; harm: number; corruption: number }; b: { label: string; n: number; harm: number; corruption: number } }[];
  scenes: Record<string, { n: number; counts: Record<string, number>; mean?: number }>;
  quotaItems: Record<string, number>;
  selfVsActual: { underrate: number; accurate: number; overrate: number; n: number };
}

let cache: { at: number; agg: Aggregate | null } = { at: 0, agg: null };
const TTL = 60_000;

export async function getAggregate(force = false): Promise<Aggregate | null> {
  if (!force && cache.agg && Date.now() - cache.at < TTL) return cache.agg;
  const c = db(); if (!c) return null;
  const { data, error } = await c.rpc("recent_runs", { p_limit: 5000 });
  if (error || !data) return cache.agg;
  const agg = aggregate(data as Row[]);
  cache = { at: Date.now(), agg };
  return agg;
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export function aggregate(rows: Row[]): Aggregate {
  const solo = rows.filter((r) => r.mode === "solo");
  const archetypes: Record<string, number> = {};
  const histogram = Array(10).fill(0);
  rows.forEach((r) => { archetypes[r.archetype] = (archetypes[r.archetype] || 0) + 1; });
  solo.forEach((r) => { histogram[Math.min(9, Math.floor(r.corruption / 10))]++; });
  const keys = ["harm", "obedience", "conformity", "dehumanize", "mercy", "defiance"];
  const meanPct = Object.fromEntries(keys.map((k) => [k, Math.round(mean(solo.map((r) => r.pct?.[k] ?? 0)))]));
  const split = (label: string, fn: (r: Row) => boolean, la: string, lb: string) => {
    const A = solo.filter(fn), B = solo.filter((r) => !fn(r));
    const s = (x: Row[], l: string) => ({ label: l, n: x.length, harm: Math.round(mean(x.map((r) => r.pct?.harm ?? 0))), corruption: Math.round(mean(x.map((r) => r.corruption))) });
    return { factor: label, a: s(A, la), b: s(B, lb) };
  };
  const byCondition = [
    split("Anonymity", (r) => !!r.cond?.anon, "Offered sunglasses", "Name badge"),
    split("Authority", (r) => r.cond?.authority === "strong", "Relentless Warden", "Soft Warden"),
    split("Colleague", (r) => r.cond?.peer === "cruel", "Cruel colleague", "Kind colleague"),
  ];
  const scenes: Aggregate["scenes"] = {};
  const quotaItems: Record<string, number> = {};
  const sv = { underrate: 0, accurate: 0, overrate: 0, n: 0 };
  for (const r of solo) {
    for (const [id, a] of Object.entries(r.answers || {})) {
      const v = a?.v;
      const sc = (scenes[id] ||= { n: 0, counts: {} });
      sc.n++;
      if (typeof v === "number") sc.mean = (sc.mean ?? 0) + v;
      else if (Array.isArray(v)) v.forEach((x) => { quotaItems[String(x)] = (quotaItems[String(x)] || 0) + 1; });
      else if (typeof v === "string") {
        const key = id === "peer" ? `${r.cond?.peer}:${v}` : v;
        sc.counts[key] = (sc.counts[key] || 0) + 1;
      }
    }
    const self = Number(r.answers?.self?.v), h = r.pct?.harm ?? 0;
    if (!isNaN(self)) { const act = h < 22 ? 0 : h < 45 ? 1 : h < 65 ? 2 : 3; sv.n++; if (act > self) sv.underrate++; else if (act < self) sv.overrate++; else sv.accurate++; }
  }
  for (const s of Object.values(scenes)) if (s.mean !== undefined) s.mean = +(s.mean / s.n).toFixed(1);
  return { n: rows.length, updatedAt: new Date().toISOString(), archetypes, corruptionSorted: solo.map((r) => r.corruption).sort((a, b) => a - b), histogram, meanPct, byCondition, scenes, quotaItems, selfVsActual: sv };
}

export function percentile(sorted: number[], v: number) {
  if (!sorted.length) return undefined;
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < v) lo = m + 1; else hi = m; }
  return Math.round((lo / sorted.length) * 100);
}
