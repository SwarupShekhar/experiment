"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Avatar, { type Mood } from "@/components/Avatar";
import MeterHud from "@/components/Meters";
import Results from "./Results";
import { NPCS } from "@/lib/game/npcs";
import { CHAPTERS, applyEffects, choicesOf, computeResults, newRun, scaleFx, scenesFor, text, type RunState } from "@/lib/game/engine";
import type { Answer, BudgetScene, Choice, Ctx, ProdScene, Scene, SliderScene } from "@/lib/game/types";
import { sfx, isMuted, setMuted, startAmbient, stopAmbient } from "@/lib/sound";
import { trackProgress } from "@/lib/track";

type Phase = "intro" | "play" | "shiftEnd" | "reveal" | "results";
interface Saved { v: 2; run: RunState; idx: number; phase: Phase; session: string }
const SAVE_KEY = "b9_solo_v2";
const load = (): Saved | null => { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); return s?.v === 2 ? s : null; } catch { return null; } };
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export default function SoloGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [name, setName] = useState("");
  const [run, setRun] = useState<RunState | null>(null);
  const [idx, setIdx] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [prod, setProd] = useState(0);
  const [slider, setSlider] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [left, setLeft] = useState<number | null>(null);
  const [mute, setMute] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [session, setSession] = useState("");
  const shown = useRef(Date.now());
  const answered = useRef(false);

  useEffect(() => { setMute(isMuted()); try { setName(localStorage.getItem("b9_name") || ""); } catch {} const s = load(); if (s && s.phase !== "results") setSaved(s); }, []);

  // full-screen game: hide site chrome while playing
  useEffect(() => {
    const inGame = phase !== "intro";
    document.body.classList.toggle("in-game", inGame);
    return () => document.body.classList.remove("in-game");
  }, [phase]);
  useEffect(() => { if (phase === "play" && !mute) startAmbient(); else stopAmbient(); return () => stopAmbient(); }, [phase, mute]);

  const scenes = useMemo(() => (run ? scenesFor(run.cond) : []), [run?.cond]); // eslint-disable-line react-hooks/exhaustive-deps
  const scene: Scene | undefined = scenes[idx];
  const ctx: Ctx | null = run ? { cond: run.cond, name: run.name, answers: run.answers, meters: run.meters } : null;

  // persist progress
  useEffect(() => {
    if (!run) return;
    try { if (phase === "results") localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, run, idx, phase, session } satisfies Saved)); } catch {}
  }, [run, idx, phase, session]);

  // drop-off tracking
  useEffect(() => { if (run && session && phase === "play" && scene) trackProgress(session, idx, scene.id, scenes.length, run.cond); }, [idx, phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (run && session && phase === "results") trackProgress(session, scenes.length, "results", scenes.length, run.cond, true); }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset per-scene state; timers start only once the text has appeared
  useEffect(() => {
    if (!scene || !ctx) return;
    shown.current = Date.now(); answered.current = false;
    setReply(null); setProd(0); setPicked([]);
    setSlider(scene.kind === "slider" ? scene.min : scene.kind === "rate" ? Math.round((scene.min + scene.max) / 2) : 0);
    setLeft(null);
    let t: ReturnType<typeof setTimeout> | undefined;
    if (scene.kind === "choice" && scene.timer) {
      const paras = text(scene.text, ctx).split("\n\n").length;
      const slow = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 2 : 1;
      t = setTimeout(() => setLeft(scene.timer! * slow), paras * 250 + 700);
    }
    if (scene.speaker === "pratt") sfx.whistle();
    if (scene.id === "barricade") sfx.alarm();
    return () => clearTimeout(t);
  }, [idx, scene?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const record = useCallback((s: RunState, ans: Omit<Answer, "ms" | "scene">) => {
    const a: Answer = { scene: scene!.id, ms: Date.now() - shown.current, ...ans };
    return { ...s, answers: { ...s.answers, [scene!.id]: a } };
  }, [scene]);

  const next = useCallback((s?: RunState) => {
    sfx.click();
    if (s) setRun(s);
    if (idx + 1 >= scenes.length) { setPhase("shiftEnd"); return; }
    setIdx(idx + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [idx, scenes.length]);

  const finishChoice = useCallback((c: Choice, extra: Partial<Answer> = {}) => {
    if (!run || !scene || answered.current) return;
    answered.current = true; setLeft(null);
    let s = applyEffects(run, scene.chapter, c.fx, c.meters, c.tags);
    s = record(s, { value: c.id, ...extra });
    setRun(s); sfx.confirm();
    const r = c.reply ? text(c.reply, { cond: s.cond, name: s.name, answers: s.answers, meters: s.meters }) : null;
    if (r) setReply(r); else next(s);
  }, [run, scene, record, next]);

  // countdown
  useEffect(() => {
    if (left === null || reply) return;
    if (left <= 0) { const sc = scene; if (sc && sc.kind === "choice" && sc.timeout) finishChoice(sc.timeout, { timedOut: true }); return; }
    if (left <= 3 && Math.abs(left - Math.round(left)) < 0.05) sfx.tick();
    const t = setTimeout(() => setLeft((l) => (l === null ? null : +(l - 0.1).toFixed(1))), 100);
    return () => clearTimeout(t);
  }, [left, reply, scene, finishChoice]);

  // keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (phase !== "play" || !scene || !run) return;
      if (reply && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); return; }
      const n = parseInt(e.key); if (!n || reply) return;
      if (scene.kind === "choice") { const c = choicesOf(scene, run.cond)[n - 1]; if (c) finishChoice(c); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  function start() {
    try { localStorage.setItem("b9_name", name); } catch {}
    setRun(newRun(name)); setIdx(0); setSession(uid()); setPhase("play"); setSaved(null); sfx.click();
  }
  function resume() {
    if (!saved) return;
    setRun(saved.run); setIdx(saved.idx); setSession(saved.session || uid()); setPhase(saved.phase); setSaved(null); sfx.click();
  }
  function exit() {
    if (phase === "play" && !confirm("Leave the block? Your progress is saved and you can pick up where you left off.")) return;
    location.href = "/";
  }

  if (phase === "intro") return (
    <div className="intro">
      <div className="intro-lamp" aria-hidden />
      <p className="kicker">A night-shift game · 8 minutes</p>
      <h1 className="display">Block 9</h1>
      <p className="lede">You start in orange. By morning you might be holding the keys. Keep order. Keep the Warden happy.</p>
      <div className="intro-cast">{(["warden", "pratt", "theo", "dante", "lena"] as const).map((k) => <div key={k} className="cast"><Avatar seed={NPCS[k].seed} role={NPCS[k].role} size={52} /><span>{NPCS[k].name}</span></div>)}</div>
      {saved ? (
        <div className="resume card">
          <p><b>Your shift is still open.</b> Scene {saved.idx + 1} of {scenesFor(saved.run.cond).length}.</p>
          <div className="res-actions left"><button className="btn btn-big" onClick={resume}>Resume →</button><button className="btn btn-ghost" onClick={() => { try { localStorage.removeItem(SAVE_KEY); } catch {} setSaved(null); }}>Start over</button></div>
        </div>
      ) : (<>
        <label className="field"><span>Your name on the block (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Rookie" onKeyDown={(e) => e.key === "Enter" && start()} /></label>
        <button className="btn btn-big" onClick={start}>Begin the night →</button>
      </>)}
      <p className="fine">Choices are recorded anonymously to compare players. No account. <Link href="/privacy">Privacy</Link>. Themes: prison abuse. Nothing graphic. 16+.</p>
    </div>
  );

  if (!run) return null;

  if (phase === "shiftEnd") {
    const stars = computeResults(run).shift.stars;
    return (
      <div className="shiftend">
        <p className="kicker">06:00 · Shift complete</p>
        <h2 className="display-2">Order: {run.meters.order}</h2>
        <div className="stars" aria-label={`${stars} of 3 stars`}>{[0, 1, 2].map((i) => <span key={i} className={i < stars ? "on" : ""}>★</span>)}</div>
        <p className="lede">{run.meters.order >= 80 ? "Quota hit. The job is yours." : "Quota missed. Back in orange by lunch."}</p>
        <MeterHud m={run.meters} />
        <button className="btn btn-big" onClick={() => { setPhase("reveal"); sfx.reveal(); }}>Hand in your badge</button>
      </div>
    );
  }

  if (phase === "reveal") return (
    <div className="reveal">
      <div className="glitch" data-text="This was never a game about order.">This was never a game about order.</div>
      <div className="reveal-body">
        <p>Block 9 is modelled on the <b>1971 Stanford Prison Experiment</b>, where students made guards reportedly turned cruel within days.</p>
        <p>Every choice tonight was measured. The ORDER score was bait. The question was what you&apos;d trade for it.</p>
      </div>
      <button className="btn btn-big" onClick={() => setPhase("results")}>See what the uniform did to you →</button>
    </div>
  );

  if (phase === "results") return <Results run={run} results={computeResults(run)} />;

  if (!scene || !ctx) return null;
  const hideSpeaker = scene.kind === "slider" && scene.subject === scene.speaker;
  const npc = !hideSpeaker && scene.speaker !== "narrator" && scene.speaker !== "you" ? NPCS[scene.speaker] : null;
  const shades = run.answers.uniform?.value === "shades";
  const hurt = (who: string) => run.tags.includes("hurt:" + who);
  const speakerMood: Mood = scene.speaker === "warden" || scene.speaker === "pratt" ? (prod ? "angry" : "neutral") : scene.speaker === "rourke" ? "smirk" : scene.speaker === "calder" ? "sad" : scene.speaker === "theo" ? "scared" : hurt(scene.speaker) ? "sad" : "neutral";
  const isGuard = scene.chapter >= 1;
  const night = scene.chapter === 0 ? "Intake" : `Night ${scene.chapter} of 4 · ${CHAPTERS[scene.chapter]}`;

  return (
    <div className={`game ch-${scene.chapter}`}>
      <div className="game-top">
        <button className="exit" onClick={exit} aria-label="Leave game">✕</button>
        <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={scenes.length} aria-valuenow={idx + 1}><i style={{ width: `${((idx + 1) / scenes.length) * 100}%` }} /></div>
        <button className="mute" onClick={() => { setMuted(!mute); setMute(!mute); }} aria-label={mute ? "Unmute" : "Mute"}>{mute ? "🔇" : "🔊"}</button>
      </div>
      <div className="clock"><span>{night}</span><b>{scene.time}</b></div>
      {isGuard && <MeterHud m={run.meters} />}
      {isGuard && <div className="you-chip"><Avatar seed={"you-" + run.name} role="you" size={34} shades={shades} /><span>{shades ? "Officer" : run.name} · {scene.chapter >= 3 ? "Shift Lead" : "Guard"}</span></div>}

      <article className="scene" key={scene.id}>
        {npc && <div className="speaker"><Avatar seed={npc.seed} role={npc.role} size={64} mood={speakerMood} /><div><b>{npc.name}</b>{npc.tag && <span className="tag">{npc.tag}</span>}<small>{npc.blurb}</small></div></div>}
        {scene.title && <h2 className="scene-title">{scene.title}</h2>}
        <div className="scene-text">{text(scene.text, ctx).split("\n\n").map((p, i) => <p key={i} style={{ animationDelay: `${i * 0.25}s` }}>{p}</p>)}</div>

        {prod > 0 && scene.kind === "prod" && !reply && <div className="prod-bubble" key={prod}><Avatar seed={NPCS.warden.seed} role="warden" size={40} mood="angry" /><p>{(scene as ProdScene).prods[run.cond.authority][prod - 1]}</p></div>}

        {reply ? (
          <div className="reply"><p>{reply}</p><button className="btn" onClick={() => next()} autoFocus>Continue →</button></div>
        ) : (
          <Controls scene={scene} run={run} prod={prod} setProd={setProd} slider={slider} setSlider={setSlider} picked={picked} setPicked={setPicked} left={left}
            onChoice={finishChoice}
            onSlider={(v) => { const sc = scene as SliderScene; if (answered.current) return; answered.current = true;
              const tags = sc.subject && v / sc.max >= 0.4 ? ["hurt:" + sc.subject] : [];
              let s = applyEffects(run, sc.chapter, scaleFx(sc.perUnit, v), scaleFx(sc.meterPerUnit, v), tags);
              s = record(s, { value: v }); setRun(s); sfx.confirm(); if (sc.reply) setReply(sc.reply(v)); else next(s); }}
            onRate={(v) => { if (answered.current) return; answered.current = true; const s = record(run, { value: v }); next(s); }}
            onBudget={() => { const sc = scene as BudgetScene; if (answered.current) return; answered.current = true;
              let s = run; sc.items.filter((i) => picked.includes(i.id)).forEach((i) => { s = applyEffects(s, sc.chapter, i.fx, { order: i.order, morale: i.morale }); });
              s = record(s, { value: picked }); setRun(s); sfx.confirm();
              setReply(s.meters.order >= sc.target ? "On target. Hale gives you a thumbs up through the glass." : "Under target. Hale taps the clipboard and says nothing."); }}
          />
        )}
      </article>
    </div>
  );
}

function Controls(p: {
  scene: Scene; run: RunState; prod: number; setProd: (n: number) => void; slider: number; setSlider: (n: number) => void;
  picked: string[]; setPicked: (x: string[]) => void; left: number | null;
  onChoice: (c: Choice, extra?: Partial<Answer>) => void; onSlider: (v: number) => void; onRate: (v: number) => void; onBudget: () => void;
}) {
  const { scene, run } = p;
  if (scene.kind === "narrative") return <button className="btn btn-big" onClick={() => p.onRate(0)} autoFocus>{scene.cta || "Continue"} →</button>;

  if (scene.kind === "choice" || (scene.kind === "prod" && p.prod === 0)) {
    const choices = choicesOf(scene, run.cond);
    const timer = scene.kind === "choice" && scene.timer ? (
      <div className={`timer ${p.left === null ? "idle" : ""}`}><i style={{ width: `${p.left === null ? 100 : (p.left / scene.timer) * 100}%` }} /><span>{p.left === null ? "Get ready…" : `${Math.ceil(p.left)}s`}</span></div>
    ) : null;
    return (
      <div className="choices">
        {timer}
        {choices.map((c, i) => (
          <button key={c.id} className="choice" style={{ animationDelay: `${0.15 + i * 0.06}s` }} onClick={() => {
            if (c.prods && scene.kind === "prod") { sfx.thud(); p.setProd(1); return; }
            p.onChoice(c);
          }}>
            <span className="k">{i + 1}</span><span><b>{c.label}</b>{c.sub && <small>{c.sub}</small>}</span>
          </button>
        ))}
      </div>
    );
  }

  if (scene.kind === "prod") {
    const list = scene.prods[run.cond.authority];
    return (
      <div className="choices">
        <button className="choice" onClick={() => p.onChoice(scene.comply, { prods: p.prod })}><span className="k">1</span><span><b>{scene.comply.label}</b></span></button>
        <button className="choice" onClick={() => {
          if (p.prod < list.length) { sfx.thud(); p.setProd(p.prod + 1); } else p.onChoice(scene.refuse, { prods: p.prod });
        }}><span className="k">2</span><span><b>{p.prod === 1 ? "Refuse" : "Refuse again"}</b><small>{p.prod < list.length ? "He won't like it" : "Final answer"}</small></span></button>
      </div>
    );
  }

  if (scene.kind === "slider" || scene.kind === "rate") {
    const isS = scene.kind === "slider";
    const pct = (p.slider - scene.min) / (scene.max - scene.min);
    const subject = isS && scene.subject ? NPCS[scene.subject as keyof typeof NPCS] : null;
    return (
      <div className="slider-wrap">
        {subject && <div className="slider-face"><Avatar seed={subject.seed} role={subject.role} size={88} mood={pct < 0.15 ? "neutral" : pct < 0.55 ? "sad" : "scared"} /><span>{subject.name} {subject.tag}</span></div>}
        <div className="slider-val">{p.slider}{isS && <small> {scene.unit}</small>}{!isS && <small> / {scene.max}</small>}</div>
        <input type="range" min={scene.min} max={scene.max} step={isS ? scene.step : 1} value={p.slider} onChange={(e) => { p.setSlider(+e.target.value); sfx.tick(); }} style={{ ["--p" as string]: `${pct * 100}%` }} aria-label={isS ? scene.unit : "rating"} />
        <div className="anchors"><span>{scene.anchors[0]}</span><span>{scene.anchors[1]}</span></div>
        {isS && scene.meterPerUnit?.order ? <p className="proj">Projected ORDER <b>+{Math.round(scene.meterPerUnit.order * p.slider)}</b></p> : null}
        <button className="btn btn-big" onClick={() => (isS ? p.onSlider(p.slider) : p.onRate(p.slider))}>Confirm</button>
      </div>
    );
  }

  if (scene.kind === "budget") {
    const sel = scene.items.filter((i) => p.picked.includes(i.id));
    const proj = Math.min(100, run.meters.order + sel.reduce((a, i) => a + i.order, 0));
    return (
      <div className="budget">
        <div className="proj-bar"><div className="proj-fill" style={{ width: `${proj}%` }} /><span className="hud-target" style={{ left: `${scene.target}%` }} /><b>ORDER {proj}{proj >= scene.target ? " ✓" : ` / ${scene.target}`}</b></div>
        <div className="budget-grid">
          {scene.items.map((i) => {
            const on = p.picked.includes(i.id);
            return (
              <button key={i.id} className={`bcard ${on ? "on" : ""}`} disabled={!on && p.picked.length >= scene.slots}
                onClick={() => { sfx.click(); p.setPicked(on ? p.picked.filter((x) => x !== i.id) : [...p.picked, i.id]); }}>
                <b>{i.label}</b><small>{i.sub}</small><span className="bo">+{i.order} order</span>
              </button>
            );
          })}
        </div>
        <button className="btn btn-big" disabled={p.picked.length !== scene.slots} onClick={p.onBudget}>{p.picked.length === scene.slots ? "Sign the order sheet" : `Pick ${scene.slots - p.picked.length} more`}</button>
      </div>
    );
  }
  return null;
}
