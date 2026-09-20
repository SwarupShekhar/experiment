import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARCHETYPES } from "@/lib/game/engine";

type P = { params: { id: string }; searchParams: { c?: string } };
const score = (c?: string) => { const n = Number(c); return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null; };

export function generateMetadata({ params, searchParams }: P): Metadata {
  const a = ARCHETYPES[params.id]; if (!a) return {};
  const c = score(searchParams.c);
  const title = `Someone got ${a.title}${c !== null ? ` (${c}/100)` : ""} on Block 9`;
  const img = `/api/og?a=${a.id}${c !== null ? `&c=${c}` : ""}`;
  return { title, description: `${a.line} One night shift. How far would you go?`, robots: { index: false }, openGraph: { title, description: a.line, images: [{ url: img, width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", title, description: a.line, images: [img] } };
}

export default function Shared({ params, searchParams }: P) {
  const a = ARCHETYPES[params.id]; if (!a) notFound();
  const c = score(searchParams.c);
  return (
    <div className="shared">
      <p className="kicker">A friend&apos;s case file</p>
      <div className="arch-stamp">{a.title}</div>
      {c !== null && <p className="shared-c"><b>{c}</b>/100 corruption</p>}
      <p className="arch-line">{a.line}</p>
      <p className="lede">One night shift at Block 9. Would you do better?</p>
      <Link className="btn btn-big" href="/play">Take the shift →</Link>
    </div>
  );
}
