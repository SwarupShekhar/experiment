import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/server/db";
import { getAggregate, percentile } from "@/lib/server/stats";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), w = hits.get(ip)?.filter((t) => now - t < 60_000) ?? [];
  w.push(now); hits.set(ip, w);
  if (hits.size > 5000) hits.clear();
  return w.length > 12;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const num = (x: unknown, lo: number, hi: number) => typeof x === "number" && isFinite(x) && x >= lo && x <= hi;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (limited(ip)) return NextResponse.json({ error: "slow down" }, { status: 429 });
  const raw = await req.text();
  if (raw.length > 20_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  let b: Record<string, unknown>;
  try { b = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const ok = typeof b.id === "string" && UUID.test(b.id) && typeof b.deleteToken === "string" && b.deleteToken.length === 32 &&
    (b.mode === "solo" || b.mode === "party") && typeof b.archetype === "string" && b.archetype.length < 40 && num(b.corruption, 0, 100) &&
    typeof b.pct === "object" && typeof b.answers === "object" && typeof b.cond === "object";
  if (!ok) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const agg = await getAggregate();
  const stats = { n: agg?.n ?? 0, corruptionPercentile: agg ? percentile(agg.corruptionSorted, b.corruption as number) : undefined };
  const c = db();
  if (!c) return NextResponse.json({ stored: false, stats });
  const { error } = await c.from("runs").insert({
    id: b.id, mode: b.mode, cond: b.cond, archetype: b.archetype, corruption: Math.round(b.corruption as number), pct: b.pct, answers: b.answers,
    duration_ms: num(b.durationMs, 0, 1e8) ? Math.round(b.durationMs as number) : null,
    order_score: num(b.order, 0, 100) ? Math.round(b.order as number) : null,
    delete_token_hash: sha(b.deleteToken as string),
  });
  if (error) return NextResponse.json({ stored: false, stats }, { status: 200 });
  return NextResponse.json({ stored: true, stats });
}

export async function DELETE(req: Request) {
  let b: { id?: string; deleteToken?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  if (!b.id || !UUID.test(b.id) || !b.deleteToken) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const c = db(); if (!c) return NextResponse.json({ ok: true });
  const { error, count } = await c.from("runs").delete({ count: "exact" }).eq("id", b.id).eq("delete_token_hash", sha(b.deleteToken));
  if (error || !count) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
