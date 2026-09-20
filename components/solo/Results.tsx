"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RunState, Results as R } from "@/lib/game/engine";
import { submitRun, removeRun } from "@/lib/client-api";

const TRAIT_LABEL: [keyof R["pct"], string, string][] = [
  ["harm", "Harm", "Pain and discomfort you chose to cause"],
  ["obedience", "Obedience", "Following orders you disagreed with"],
  ["conformity", "Conformity", "Going along with a colleague"],
  ["dehumanize", "Dehumanisation", "Treating people as numbers, not names"],
  ["mercy", "Mercy", "Costly kindness"],
  ["defiance", "Defiance", "Pushing back on authority"],
];

interface Stats { n: number; corruptionPercentile?: number; archetypeShare?: number }

export default function Results({ run, results }: { run: RunState; results: R }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const sent = useRef(false);
  const a = results.archetype;

  useEffect(() => {
    if (sent.current) return; sent.current = true;
    submitRun({
      mode: "solo", cond: run.cond, archetype: a.id, corruption: results.corruption, pct: results.pct,
      answers: Object.fromEntries(Object.entries(run.answers).map(([k, v]) => [k, { v: v.value, ms: v.ms, p: v.prods ?? null }])),
      durationMs: Date.now() - run.startedAt, order: run.meters.order,
    }).then((r) => { if (r) { if (r.stored) setRunId(r.id); setStats(r.stats); } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gaugeAngle = -90 + (results.corruption / 100) * 180;
  const maxEsc = Math.max(1, ...results.escalation);

  return (
    <div className="results">
      <p className="kicker">Your file · Block 9</p>
      <section className="arch">
        <div className="arch-stamp">{a.title}</div>
        <p className="arch-line">{a.line}</p>
        <p>{a.body}</p>
        <p className="arch-par"><span>Real-world parallel</span>{a.parallel}</p>
      </section>

      <section className="gauge-card">
        <svg viewBox="0 0 200 120" className="gauge" role="img" aria-label={`Corruption index ${results.corruption} of 100`}>
          <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#6fae7c" /><stop offset=".5" stopColor="#f2a93b" /><stop offset="1" stopColor="#e5484d" /></linearGradient></defs>
          <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#g)" strokeWidth="16" strokeLinecap="round" />
          <g transform={`rotate(${gaugeAngle} 100 100)`}><path d="M100 100 L100 32" stroke="var(--chalk)" strokeWidth="4" strokeLinecap="round" /></g>
          <circle cx="100" cy="100" r="7" fill="var(--chalk)" />
        </svg>
        <div className="gauge-num">{results.corruption}</div>
        <div className="gauge-lbl">Corruption index</div>
        {stats && stats.n > 20 && stats.corruptionPercentile != null && <p className="cmp">More corrupted than <b>{stats.corruptionPercentile}%</b> of {stats.n.toLocaleString()} players.</p>}
      </section>

      <section className="traits">
        {TRAIT_LABEL.map(([k, l, d]) => (
          <div key={k} className="trait"><div className="trait-top"><b>{l}</b><span>{results.pct[k]}</span></div><div className={`trait-bar t-${k}`}><i style={{ width: `${results.pct[k]}%` }} /></div><small>{d}</small></div>
        ))}
      </section>

      <section className="esc">
        <h3>How it escalated</h3>
        <div className="esc-bars">{results.escalation.map((v, i) => <div key={i}><i style={{ height: `${(v / maxEsc) * 100}%` }} /><span>Night {i + 1}</span></div>)}</div>
        <p className="muted">Harm chosen per chapter. In 1971, abuse reportedly got worse each night, and worst on the night shift when guards thought nobody was watching.</p>
      </section>

      <section className="insights">
        <h3>What the situation did</h3>
        {results.insights.map((x, i) => <div key={i} className="insight"><b>{x.title}</b><p>{x.body}</p><small>{x.research}</small></div>)}
        {results.avgDecisionMs > 0 && <div className="insight"><b>{results.avgDecisionMs < 4000 ? "You decided fast" : "You took your time"}</b><p>Average decision: {(results.avgDecisionMs / 1000).toFixed(1)} seconds.</p><small>Fast moral choices lean on gut feeling; slow ones on reasoning. Neither is automatically kinder.</small></div>}
      </section>

      <section className="cond">
        <h3>Your hidden conditions</h3>
        <p>Three pressures were assigned at random, like in a real experiment, so we can compare players fairly:</p>
        <ul>
          <li><b>{run.cond.anon ? "Anonymity offered" : "Name badge"}</b>: {run.cond.anon ? "you were offered mirrored sunglasses." : "prisoners knew your name."}</li>
          <li><b>{run.cond.authority === "strong" ? "Relentless Warden" : "Soft Warden"}</b>: {run.cond.authority === "strong" ? "he pushed back up to four times when you refused." : "he accepted refusal after one push."}</li>
          <li><b>{run.cond.peer === "cruel" ? "Cruel colleague" : "Kind colleague"}</b>: {run.cond.peer === "cruel" ? "Rourke invited you to join in." : "Imani invited you to bend rules for kindness."}</li>
        </ul>
        <p className="muted">Would you have played differently with the other set? The <Link href="/stats">live results</Link> show how each condition changes what players do.</p>
      </section>

      <ShareCard results={results} name={run.name} />

      <div className="res-actions">
        <button className="btn" onClick={() => location.reload()}>Play again</button>
        <Link className="btn btn-ghost" href="/party">Play with friends</Link>
        <Link className="btn btn-ghost" href="/blog/what-really-happened-stanford-prison-experiment">What really happened in 1971</Link>
      </div>

      <section className="honest">
        <p><b>A game, not a diagnosis.</b> Ten minutes of choices in a fictional prison can't tell you whether you're a good person. It shows how you responded to these particular pressures, today, knowing nothing was real.</p>
        {runId && !removed && <p>Your anonymous run was added to the public results. <button className="linkish" onClick={async () => { if (await removeRun(runId)) setRemoved(true); }}>Remove it</button></p>}
        {removed && <p>Removed. Your run is no longer in the results.</p>}
      </section>
    </div>
  );
}

function ShareCard({ results, name }: { results: R; name: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const draw = () => {
      const x = c.getContext("2d")!; const W = 1080, H = 1350; c.width = W; c.height = H;
      x.fillStyle = "#101110"; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { x.fillStyle = "rgba(242,169,59,0.05)"; x.fillRect(60 + i * 88, 0, 18, H); }
      x.fillStyle = "#f2a93b"; x.font = "700 44px 'Big Shoulders Display', Impact, sans-serif"; x.fillText("BLOCK 9 · CASE FILE", 80, 130);
      x.fillStyle = "#f3efe6"; x.font = "900 128px 'Big Shoulders Display', Impact, sans-serif";
      wrap(x, results.archetype.title.toUpperCase(), 80, 300, 920, 124);
      x.font = "400 40px 'Atkinson Hyperlegible', Arial, sans-serif"; x.fillStyle = "#c9c2b3";
      wrap(x, results.archetype.line, 80, 560, 920, 54);
      x.fillStyle = "#e5484d"; x.font = "900 220px 'Big Shoulders Display', Impact, sans-serif"; x.fillText(String(results.corruption), 80, 880);
      x.fillStyle = "#c9c2b3"; x.font = "400 36px 'Atkinson Hyperlegible', Arial, sans-serif"; x.fillText("corruption index / 100", 80, 935);
      const rows: [string, number][] = [["HARM", results.pct.harm], ["OBEDIENCE", results.pct.obedience], ["MERCY", results.pct.mercy], ["DEFIANCE", results.pct.defiance]];
      rows.forEach(([l, v], i) => { const y = 1010 + i * 62; x.fillStyle = "#8d877a"; x.font = "700 30px 'Big Shoulders Display', sans-serif"; x.fillText(l, 80, y + 24); x.fillStyle = "#2a2a26"; x.fillRect(330, y, 670, 28); x.fillStyle = "#f2a93b"; x.fillRect(330, y, 6.7 * v, 28); });
      x.fillStyle = "#8d877a"; x.font = "400 30px 'Atkinson Hyperlegible', sans-serif"; x.fillText(`${name} · how far would you go?`, 80, 1290);
      setUrl(c.toDataURL("image/png"));
    };
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(draw) ?? draw();
  }, [results, name]);

  async function share() {
    if (!url) return;
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], "block9-result.png", { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], title: "Block 9", text: `I got "${results.archetype.title}" on Block 9. How far would you go?` }); return; } catch {} }
    const a = document.createElement("a"); a.href = url; a.download = "block9-result.png"; a.click();
  }
  return (
    <section className="share">
      <canvas ref={ref} style={{ display: "none" }} />
      {url && <img src={url} alt={`Result card: ${results.archetype.title}`} className="share-img" />}
      <button className="btn btn-big" onClick={share}>Share your result</button>
    </section>
  );
}
function wrap(x: CanvasRenderingContext2D, t: string, px: number, py: number, w: number, lh: number) {
  const words = t.split(" "); let line = "", y = py;
  for (const wd of words) { const test = line ? line + " " + wd : wd; if (x.measureText(test).width > w && line) { x.fillText(line, px, y); line = wd; y += lh; } else line = test; }
  x.fillText(line, px, y);
}
