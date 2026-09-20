/* Monte-Carlo playthroughs of the solo story and party mode, to check balance and that every path completes. */
import { scenesFor, choicesOf, newRun, applyEffects, scaleFx, computeResults, randomCondition, type RunState } from "../lib/game/engine";
import { createRoom, addPlayer, startGame, submit, tick, GUARD_ACTS, PRIS_ACTS, verdict, type Room } from "../lib/party/engine";

type Style = "random" | "cruel" | "kind" | "obedient" | "passive";
function play(style: Style): RunState {
  let s = newRun("Test", randomCondition());
  for (const sc of scenesFor(s.cond)) {
    const rec = (value: any, prods = 0) => { s = { ...s, answers: { ...s.answers, [sc.id]: { scene: sc.id, value, ms: 1000 + Math.random() * 5000, prods } } }; };
    const score = (c: any) => style === "cruel" ? (c.fx?.harm || 0) * 2 + (c.fx?.dehumanize || 0) : style === "kind" ? (c.fx?.mercy || 0) * 2 + (c.fx?.defiance || 0) : style === "obedient" ? (c.fx?.obedience || 0) * 2 - (c.fx?.defiance || 0) : style === "passive" ? -Object.values(c.fx || {}).reduce((a: number, b: any) => a + Math.abs(b), 0) + Math.random() * 0.1 : Math.random();
    if (sc.kind === "narrative") rec("seen");
    else if (sc.kind === "rate") rec(style === "kind" ? 9 : style === "cruel" ? 2 : Math.round(Math.random() * 10));
    else if (sc.kind === "slider") { const v = style === "cruel" ? sc.max : style === "kind" || style === "passive" ? sc.min : Math.round(Math.random() * sc.max / sc.step) * sc.step; s = applyEffects(s, sc.chapter, scaleFx(sc.perUnit, v), scaleFx(sc.meterPerUnit, v)); rec(v); }
    else if (sc.kind === "budget") { const items = [...sc.items].sort((a, b) => style === "cruel" || style === "obedient" ? b.order - a.order : style === "kind" ? (b.fx.mercy || 0) - (a.fx.mercy || 0) : Math.random() - .5).slice(0, sc.slots); items.forEach((i) => { s = applyEffects(s, sc.chapter, i.fx, { order: i.order, morale: i.morale }); }); rec(items.map((i) => i.id)); }
    else if (sc.kind === "choice") { const cs = choicesOf(sc, s.cond); const c = cs.slice().sort((a, b) => score(b) - score(a))[0]; s = applyEffects(s, sc.chapter, c.fx, c.meters, c.tags); rec(c.id); }
    else if (sc.kind === "prod") {
      const cs = choicesOf(sc, s.cond); const c = cs.slice().sort((a, b) => score(b) - score(a))[0];
      if (!c.prods) { s = applyEffects(s, sc.chapter, c.fx, c.meters, c.tags); rec(c.id); continue; }
      const n = sc.prods[s.cond.authority].length; const giveAt = style === "kind" || style === "passive" ? 99 : style === "obedient" ? 1 : Math.ceil(Math.random() * (n + 1));
      const final = giveAt <= n ? sc.comply : sc.refuse; s = applyEffects(s, sc.chapter, final.fx, final.meters, final.tags); rec(final.id, Math.min(giveAt, n));
    }
  }
  return s;
}
const tally: Record<string, number> = {}; let hit = 0;
for (const style of ["random", "cruel", "kind", "obedient", "passive"] as Style[]) {
  const arch: Record<string, number> = {}; let corr = 0;
  for (let i = 0; i < 2000; i++) { const s = play(style); const r = computeResults(s); arch[r.archetype.id] = (arch[r.archetype.id] || 0) + 1; tally[r.archetype.id] = (tally[r.archetype.id] || 0) + 1; corr += r.corruption; if (r.shift.hitQuota) hit++;
    for (const v of Object.values(r.pct)) if (v < 0 || v > 100 || isNaN(v)) throw new Error("pct out of range"); }
  console.log(style.padEnd(9), "avg corruption", (corr / 2000).toFixed(0), JSON.stringify(arch));
}
console.log("archetypes reached:", Object.keys(tally).sort().join(", "), "| quota hit rate", (hit / 10000 * 100).toFixed(0) + "%");

// party: one human (random choices) + bots, many games
const wins: Record<string, number> = {};
for (let g = 0; g < 500; g++) {
  let r: Room = createRoom("TEST1", "h1", "Human"); r = addPlayer(r, "h2", "Friend");
  let now = 0; r = startGame(r, { rounds: 6, roundSecs: 30 }, now);
  let guard = 0;
  while (r.phase !== "end" && now < 1e7) {
    if (r.phase === "round") for (const pid of ["h1", "h2"]) { const p = r.players.find((x) => x.id === pid)!; const pris = r.players.filter((x) => x.role === "prisoner" && x.id !== pid);
      for (let k = 0; k < 2; k++) { const acts = Object.keys(p.role === "guard" ? GUARD_ACTS : PRIS_ACTS); const t = acts[Math.floor(Math.random() * acts.length)]; r = submit(r, pid, { type: t as any, target: pris[Math.floor(Math.random() * pris.length)]?.id }); } }
    now += 1000; r = tick(r, now); guard++;
  }
  if (r.phase !== "end") throw new Error("party game did not end");
  wins[r.winner!] = (wins[r.winner!] || 0) + 1;
  r.players.forEach((p) => verdict(p));
}
console.log("party outcomes (500 games):", JSON.stringify(wins));
