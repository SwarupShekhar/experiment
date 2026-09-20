"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CHAPTERS, type RunState, type Results as R } from "@/lib/game/engine";
import { submitRun, removeRun } from "@/lib/client-api";
import { sfx } from "@/lib/sound";

const TRAIT_LABEL: [keyof R["pct"], string, string][] = [
  ["harm", "Harm", "Pain and discomfort you chose to cause"],
  ["obedience", "Obedience", "Following orders you disagreed with"],
  ["conformity", "Conformity", "Going along with a colleague"],
  ["dehumanize", "Dehumanisation", "Numbers and nicknames instead of names"],
  ["mercy", "Mercy", "Kindness that cost you"],
  ["defiance", "Defiance", "Pushing back on authority"],
];
interface Stats { n: number; corruptionPercentile?: number }

export default function Results({ run, results }: { run: RunState; results: R }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [copied, setCopied] = useState(false);
  const sent = useRef(false);
  const a = results.archetype;
  const shareUrl = typeof window !== "undefined" ? `${location.origin}/r/${a.id}?c=${results.corruption}` : "";
  const shareText = `I got "${a.title}" on Block 9 (corruption ${results.corruption}/100). One night shift. How far would you go?`;

  useEffect(() => {
    if (sent.current) return; sent.current = true;
    submitRun({
      mode: "solo", cond: run.cond, archetype: a.id, corruption: results.corruption, pct: results.pct,
      answers: Object.fromEntries(Object.entries(run.answers).map(([k, v]) => [k, { v: v.value, ms: v.ms, p: v.prods ?? null }])),
      durationMs: Date.now() - run.startedAt, order: run.meters.order,
    }).then((r) => { if (r) { if (r.stored) setRunId(r.id); setStats(r.stats); } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function share() {
    sfx.click();
    const nav = navigator as Navigator;
    if (nav.share) { try { await nav.share({ title: "Block 9", text: shareText, url: shareUrl }); return; } catch { return; } }
    copy();
  }
  async function copy() { try { await navigator.clipboard.writeText(`${shareText} ${shareUrl}`); setCopied(true); sfx.confirm(); setTimeout(() => setCopied(false), 2000); } catch {} }

  const top = results.insights.slice(0, 3), more = results.insights.slice(3);
  const maxEsc = Math.max(1, ...results.escalation);
  const angle = -90 + (results.corruption / 100) * 180;

  return (
    <div className="results">
      <section className="arch">
        <p className="kicker">Your file · Block 9</p>
        <div className="arch-stamp">{a.title}</div>
        <p className="arch-line">{a.line}</p>
        <div className="score-strip">
          <svg viewBox="0 0 200 112" className="gauge" role="img" aria-label={`Corruption index ${results.corruption} of 100`}>
            <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#6fae7c" /><stop offset=".5" stopColor="#f2a93b" /><stop offset="1" stopColor="#e5484d" /></linearGradient></defs>
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#g)" strokeWidth="16" strokeLinecap="round" />
            <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px" }}><path d="M100 100 L100 34" stroke="var(--chalk)" strokeWidth="4" strokeLinecap="round" /></g>
            <circle cx="100" cy="100" r="7" fill="var(--chalk)" />
          </svg>
          <div><div className="gauge-num">{results.corruption}</div><div className="gauge-lbl">Corruption index</div>
            {stats && stats.n >= 20 && stats.corruptionPercentile != null && <p className="cmp">Higher than <b>{stats.corruptionPercentile}%</b> of {stats.n.toLocaleString()} players</p>}</div>
        </div>
        <div className="share-row">
          <button className="btn btn-big" onClick={share}>Share result</button>
          <button className="btn btn-ghost" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
        </div>
      </section>

      {top.length > 0 && (
        <section>
          <h3 className="sec-h">What the night revealed <small>swipe →</small></h3>
          <div className="cards">{top.map((x, i) => <div key={i} className="icard"><span className="icard-n">{i + 1}/{top.length}</span><b>{x.title}</b><p>{x.body}</p><small>{x.research}</small></div>)}</div>
        </section>
      )}

      <section className="fold">
        <details><summary>Your scores</summary>
          <div className="traits">{TRAIT_LABEL.map(([k, l, d]) => (
            <div key={k} className="trait"><div className="trait-top"><b>{l}</b><span>{results.pct[k]}</span></div><div className={`trait-bar t-${k}`}><i style={{ width: `${results.pct[k]}%` }} /></div><small>{d}</small></div>
          ))}</div>
          <h4>How it escalated</h4>
          <div className="esc-bars">{results.escalation.map((v, i) => <div key={i}><i style={{ height: `${(v / maxEsc) * 100}%` }} /><span>{CHAPTERS[i + 1]}</span></div>)}</div>
          {results.avgDecisionMs > 0 && <p className="muted small">Average decision time: {(results.avgDecisionMs / 1000).toFixed(1)}s.</p>}
        </details>
        <details><summary>Why “{a.title}”?</summary><p>{a.body}</p><p className="arch-par"><span>Real-world parallel</span>{a.parallel}</p></details>
        <details><summary>Your hidden conditions</summary>
          <p className="small">Three pressures were assigned at random, so players can be compared fairly:</p>
          <ul className="small">
            <li><b>{run.cond.anon ? "Anonymity offered" : "Name badge"}</b>: {run.cond.anon ? "you were offered mirrored sunglasses." : "prisoners knew your name."}</li>
            <li><b>{run.cond.authority === "strong" ? "Relentless Warden" : "Soft Warden"}</b>: {run.cond.authority === "strong" ? "he pushed back several times when you refused." : "he let it go after one push."}</li>
            <li><b>{run.cond.peer === "cruel" ? "Cruel colleague" : "Kind colleague"}</b>: {run.cond.peer === "cruel" ? "Rourke invited you to join in." : "Imani invited you to bend rules for kindness."}</li>
          </ul>
          <p className="small"><Link href="/stats">See how each condition changes players →</Link></p>
        </details>
        {more.length > 0 && <details><summary>More about your night</summary>{more.map((x, i) => <div key={i} className="insight"><b>{x.title}</b><p>{x.body}</p><small>{x.research}</small></div>)}</details>}
      </section>

      <div className="res-actions">
        <button className="btn" onClick={() => location.reload()}>Play again</button>
        <Link className="btn btn-ghost" href="/party">Play with friends</Link>
      </div>
      <p className="honest"><b>A game, not a diagnosis.</b> It shows how you handled these pressures, knowing none of it was real. <Link href="/blog/what-really-happened-stanford-prison-experiment">What really happened in 1971 →</Link>
        {runId && !removed && <> · <button className="linkish" onClick={async () => { if (await removeRun(runId)) setRemoved(true); }}>Remove my data</button></>}
        {removed && <> · Removed.</>}
      </p>
    </div>
  );
}
