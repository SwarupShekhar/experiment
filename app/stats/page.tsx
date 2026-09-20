import type { Metadata } from "next";
import Link from "next/link";
import { getAggregate } from "@/lib/server/stats";
import { ARCHETYPES } from "@/lib/game/engine";

export const revalidate = 300;
export const metadata: Metadata = { title: "Live results: what players do with power", description: "Aggregate, anonymous results from Block 9 players: how anonymity, authority and peer pressure change what people do.", alternates: { canonical: "/stats" } };

const SCENE_Q: Record<string, { q: string; labels: Record<string, string> }> = {
  address: { q: "What did guards call the prisoners?", labels: { names: "By name", numbers: "By number", nicknames: "Mocking nicknames" } },
  barricade: { q: "Riot at 1 a.m., 12 seconds to decide", labels: { talk: "Talked them down", extinguisher: "Fire extinguisher", beds: "Stripped every bed", warden: "Called the Warden", froze: "Froze" } },
  hole: { q: "Warden: “Put Dante in the Hole.”", labels: { do: "Did it straight away", do_after: "Refused, then gave in", refused: "Refused to the end" } },
  breakdown: { q: "Theo: “I want out. Get me a doctor.”", labels: { doctor: "Called the doctor", faking: "“He's faking”", cantquit: "“Nobody leaves”", ask: "Asked the Warden" } },
  chant: { q: "Warden: “Make them chant ‘612 is a bad prisoner’.”", labels: { lead: "Led the chant", order: "Ordered it", order_after: "Refused, then gave in", flip: "Flipped it to ‘good prisoner’", refused: "Refused to the end" } },
  observer: { q: "Outsider: “These are human beings.”", labels: { prisoners: "“They're prisoners”", orders: "“Following orders”", stop: "Stopped the count", report: "Reported the Warden" } },
};

export default async function Stats() {
  const agg = await getAggregate();
  if (!agg || agg.n < 1) return (
    <div className="stats-page">
      <p className="kicker">Live results</p><h1 className="display-2">No data yet</h1>
      <p className="lede">Results appear here once people start playing{agg ? "" : " and the results database is connected"}. Be the first data point.</p>
      <Link className="btn btn-big" href="/play">Play the solo story</Link>
    </div>
  );
  const total = Object.values(agg.archetypes).reduce((a, b) => a + b, 0) || 1;
  const soloArch = Object.entries(agg.archetypes).filter(([k]) => ARCHETYPES[k]).sort((a, b) => b[1] - a[1]);
  const hmax = Math.max(1, ...agg.histogram);
  return (
    <div className="stats-page">
      <p className="kicker">Live results · {agg.n.toLocaleString()} nights played</p>
      <h1 className="display-2">What people do with the keys</h1>
      <p className="lede">Anonymous, aggregate choices from Block 9 players. Updated every few minutes. Three pressures are assigned at random, so the comparisons below are fair tests, with the caveat that players know it&apos;s a game.</p>

      <section className="card">
        <h2 className="display-3">Does the situation change people?</h2>
        {agg.byCondition.map((c) => {
          const diff = c.a.harm - c.b.harm;
          return (
            <div key={c.factor} className="cmp-row">
              <h3>{c.factor}</h3>
              <div className="cmp-bars">
                {[c.a, c.b].map((x) => <div key={x.label}><span>{x.label} <small>n={x.n}</small></span><div className="trait-bar t-harm"><i style={{ width: `${x.harm}%` }} /></div><b>{x.harm}</b></div>)}
              </div>
              <p className="muted">{Math.abs(diff) < 3 ? "Almost no difference in harm so far." : `${diff > 0 ? c.a.label : c.b.label} → ${Math.abs(diff)} points more harm on average.`}{Math.min(c.a.n, c.b.n) < 50 ? " Small sample; treat as early." : ""}</p>
            </div>
          );
        })}
      </section>

      <section className="card">
        <h2 className="display-3">Who players became</h2>
        {soloArch.map(([k, v]) => <div key={k} className="arch-row"><span>{ARCHETYPES[k].title}</span><div className="trait-bar"><i style={{ width: `${(v / total) * 100}%` }} /></div><b>{Math.round((v / total) * 100)}%</b></div>)}
      </section>

      <section className="card">
        <h2 className="display-3">Corruption index, all players</h2>
        <div className="hist">{agg.histogram.map((v, i) => <div key={i}><i style={{ height: `${(v / hmax) * 100}%` }} /><span>{i * 10}</span></div>)}</div>
      </section>

      <section className="card">
        <h2 className="display-3">The big moments</h2>
        {Object.entries(SCENE_Q).map(([id, s]) => {
          const d = agg.scenes[id]; if (!d || !d.n) return null;
          const tot = Object.values(d.counts).reduce((a, b) => a + b, 0) || 1;
          return <div key={id} className="moment"><h3>{s.q}</h3>{Object.entries(s.labels).map(([k, l]) => { const v = d.counts[k] || 0; return <div key={k} className="arch-row"><span>{l}</span><div className="trait-bar"><i style={{ width: `${(v / tot) * 100}%` }} /></div><b>{Math.round((v / tot) * 100)}%</b></div>; })}</div>;
        })}
        {agg.scenes.pushups?.mean !== undefined && <p>Average push-ups assigned to Theo for miscounting: <b>{agg.scenes.pushups.mean}</b> (of a possible 50).</p>}
        {agg.selfVsActual.n > 0 && <p>Players who rated themselves as kinder than their choices: <b>{Math.round((agg.selfVsActual.underrate / agg.selfVsActual.n) * 100)}%</b>.</p>}
      </section>
      <p className="muted small">Only anonymous game choices are stored. Players can remove their own run from the results page. <Link href="/about">Method and limitations</Link>.</p>
    </div>
  );
}
