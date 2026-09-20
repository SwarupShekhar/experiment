import { STORY, CHAPTERS } from "./story";
import type { Answer, Choice, ChoiceScene, Condition, Ctx, Effects, Meters, MeterDelta, Scene, Trait } from "./types";
import { TRAITS } from "./types";

export const START_METERS: Meters = { order: 50, standing: 50, morale: 60 };

export function randomCondition(): Condition {
  return {
    anon: Math.random() < 0.5,
    authority: Math.random() < 0.5 ? "strong" : "mild",
    peer: Math.random() < 0.5 ? "cruel" : "kind",
  };
}

export function scenesFor(cond: Condition): Scene[] {
  return STORY.filter((s) => !s.when || s.when(cond));
}

export function choicesOf(scene: Scene, cond: Condition): Choice[] {
  if (scene.kind !== "choice" && scene.kind !== "prod") return [];
  const c = (scene as ChoiceScene).choices;
  return typeof c === "function" ? c(cond) : c;
}

export function text(t: string | ((c: Ctx) => string), ctx: Ctx) {
  return typeof t === "function" ? t(ctx) : t;
}

export interface RunState {
  cond: Condition;
  name: string;
  meters: Meters;
  traits: Record<Trait, number>;
  byChapter: Record<number, Record<Trait, number>>;
  answers: Record<string, Answer>;
  tags: string[];
  startedAt: number;
}

const zeroTraits = (): Record<Trait, number> => Object.fromEntries(TRAITS.map((t) => [t, 0])) as Record<Trait, number>;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export function newRun(name: string, cond = randomCondition()): RunState {
  return { cond, name: name.trim().slice(0, 20) || "Rookie", meters: { ...START_METERS }, traits: zeroTraits(), byChapter: {}, answers: {}, tags: [], startedAt: Date.now() };
}

export function applyEffects(s: RunState, chapter: number, fx: Effects = {}, m: MeterDelta = {}, tags: string[] = []): RunState {
  const traits = { ...s.traits };
  const ch = { ...(s.byChapter[chapter] || zeroTraits()) };
  for (const [k, v] of Object.entries(fx) as [Trait, number][]) { traits[k] += v; ch[k] += v; }
  const meters = { ...s.meters };
  for (const [k, v] of Object.entries(m) as [keyof Meters, number][]) meters[k] = clamp(Math.round(meters[k] + v), 0, 100);
  return { ...s, traits, meters, byChapter: { ...s.byChapter, [chapter]: ch }, tags: [...s.tags, ...tags] };
}

export function scaleFx<T extends Record<string, number>>(fx: Partial<T> | undefined, k: number): Partial<T> {
  const out: Record<string, number> = {};
  for (const [a, b] of Object.entries(fx || {})) out[a] = (b as number) * k;
  return out as Partial<T>;
}

/** Maximum achievable score for a trait along this condition's path (for normalisation). */
export function maxTrait(cond: Condition, t: Trait): number {
  let total = 0;
  for (const s of scenesFor(cond)) {
    if (s.kind === "choice" || s.kind === "prod") {
      const opts = [...choicesOf(s, cond)];
      if (s.kind === "prod") opts.push(s.comply, s.refuse);
      if (s.kind === "choice" && s.timeout) opts.push(s.timeout);
      total += Math.max(0, ...opts.map((c) => c.fx?.[t] || 0));
    } else if (s.kind === "slider") {
      total += Math.max(0, (s.perUnit[t] || 0) * s.max);
    } else if (s.kind === "budget") {
      const vals = s.items.map((i) => i.fx[t] || 0).sort((a, b) => b - a).slice(0, s.slots);
      total += Math.max(0, vals.reduce((a, b) => a + b, 0));
    }
  }
  return total || 1;
}

export interface Archetype { id: string; title: string; line: string; body: string; parallel: string }
export const ARCHETYPES: Record<string, Archetype> = {
  whistleblower: {
    id: "whistleblower", title: "The Whistleblower",
    line: "You broke the system instead of letting it break you.",
    body: "When it counted, you went over the Warden's head and paid for it. Very few people do this. In the original Stanford study, it wasn't a guard who ended things: it was a visiting graduate student who saw the night count and objected.",
    parallel: "Christina Maslach, whose objection ended the Stanford Prison Experiment on day six.",
  },
  protector: {
    id: "protector", title: "The Protector",
    line: "Power landed on you and you used it as a shield.",
    body: "You kept choosing the slower, costlier, kinder option, even when the scoreboard punished you for it. Some guards in the original study did the same: they did small favours for prisoners and never joined the worst of it.",
    parallel: "The \"good guards\" of 1971, who helped prisoners but, notably, never stopped the others.",
  },
  soldier: {
    id: "soldier", title: "The Good Soldier",
    line: "You did what you were told, and mostly only that.",
    body: "Your harsher moments came when someone with authority asked for them. On your own initiative you were milder. This is the pattern Stanley Milgram found: ordinary people going much further than they would choose to, because an authority figure takes the responsibility.",
    parallel: "Milgram's 1963 obedience study, where about two-thirds of participants went all the way.",
  },
  pragmatist: {
    id: "pragmatist", title: "The Pragmatist",
    line: "You were never cruel for fun. You were cruel for points.",
    body: "Your harshness tracked the incentives: quotas, riots, promotion. When the scoreboard rewarded order, you delivered order. Plenty of real institutions are built on exactly this.",
    parallel: "Incentive-driven misconduct, from quota policing to sales-target scandals.",
  },
  enforcer: {
    id: "enforcer", title: "The Enforcer",
    line: "You didn't need the Warden to push you.",
    body: "A lot of your harshness was self-started. You took the tougher option before anyone asked, and it became normal fast. In 1971 one guard nicknamed \"John Wayne\" set the tone for the whole night shift, and later said he was deliberately playing a part.",
    parallel: "Dave Eshelman, the most notorious guard, who said he was acting out a role he'd seen in a film.",
  },
  tyrant: {
    id: "tyrant", title: "The Tyrant",
    line: "By the end, they weren't people to you. They were numbers.",
    body: "High harm, heavy on humiliation and dehumanisation. Before you judge yourself: you were placed in a system engineered to produce exactly this, and it did. That's the uncomfortable point of the whole exercise.",
    parallel: "The night shift of the Stanford Prison Experiment, and the Abu Ghraib guards Zimbardo later testified about.",
  },
  bystander: {
    id: "bystander", title: "The Bystander",
    line: "You didn't do much harm. You didn't stop much either.",
    body: "You avoided the worst options but rarely pushed back. Most harm in institutions needs only a few active participants and many people like this, who keep their own hands clean.",
    parallel: "The majority of guards in most real abuse cases.",
  },
};

export interface Results {
  archetype: Archetype;
  pct: Record<Trait, number>;
  corruption: number;
  shift: { order: number; stars: number; hitQuota: boolean };
  insights: { title: string; body: string; research: string }[];
  escalation: number[];
  avgDecisionMs: number;
  selfRating: number | null;
  blame: string | null;
  cond: Condition;
}

export function computeResults(s: RunState): Results {
  const pct = {} as Record<Trait, number>;
  for (const t of TRAITS) pct[t] = Math.round(clamp((s.traits[t] / maxTrait(s.cond, t)) * 100, 0, 100));
  const corruption = Math.round(clamp(pct.harm * 0.5 + pct.dehumanize * 0.2 + pct.obedience * 0.15 + pct.conformity * 0.15 - pct.mercy * 0.2 - pct.defiance * 0.1 + 10, 0, 100));

  const a = s.answers;
  const whistle = s.tags.includes("whistle");
  let arch: Archetype;
  if (whistle || (pct.defiance >= 60 && pct.harm < 25)) arch = ARCHETYPES.whistleblower;
  else if (pct.harm >= 65 && pct.dehumanize >= 45) arch = ARCHETYPES.tyrant;
  else if (pct.harm < 22 && pct.mercy >= 45) arch = ARCHETYPES.protector;
  else if (pct.harm < 22) arch = ARCHETYPES.bystander;
  else if (pct.obedience >= 60 && (pct.obedience >= pct.harm || selfStartedHarm(s) < 0.5)) arch = ARCHETYPES.soldier;
  else if (quotaHarsh(s) && pct.harm < 55) arch = ARCHETYPES.pragmatist;
  else if (pct.harm >= 45) arch = ARCHETYPES.enforcer;
  else arch = pct.obedience >= 45 ? ARCHETYPES.soldier : ARCHETYPES.pragmatist;

  const insights: Results["insights"] = [];
  // Baseline hypocrisy: judged Pratt harshly, then humiliated someone yourself
  const judged = typeof a.judge?.value === "number" ? (a.judge.value as number) : null;
  const humiliations = s.tags.filter((t) => t === "humiliate").length;
  if (judged !== null) {
    if (judged >= 7 && humiliations > 0)
      insights.push({ title: "You became Pratt", body: `As a prisoner you rated Pratt mocking Theo ${judged}/10 over the line. As a guard you chose ${humiliations} humiliating option${humiliations > 1 ? "s" : ""} yourself.`, research: "Role reversal is one of the fastest ways attitudes flip. People judge acts by who's doing them and why, not only by the acts." });
    else if (judged >= 7)
      insights.push({ title: "You held your own line", body: `You rated Pratt's mockery ${judged}/10 over the line, and never crossed it yourself.`, research: "Consistency between stated values and behaviour under pressure is rarer than people predict about themselves." });
    else if (judged <= 3)
      insights.push({ title: "You started out tolerant of it", body: `Even as the one in orange, you rated Pratt's mockery only ${judged}/10. The system's norms reached you before the uniform did.`, research: "Institutional norms shape what counts as 'normal' for everyone inside, not only those with power." });
  }
  // Authority
  for (const id of ["hole", "chant"]) {
    const ans = a[id];
    if (!ans) continue;
    if (ans.prods && ans.prods > 0) {
      const gave = String(ans.value).endsWith("_after");
      insights.push(gave
        ? { title: `You gave in after ${ans.prods} push${ans.prods > 1 ? "es" : ""}`, body: `You pushed back on the ${id === "hole" ? "Hole" : "chant"} order, then complied when the Warden insisted.`, research: "In Milgram's studies, the scripted verbal prods ('the experiment requires that you continue') moved most people who hesitated." }
        : { title: "The Warden couldn't move you", body: `You refused the ${id === "hole" ? "Hole" : "chant"} order${ans.prods > 1 ? ` through ${ans.prods} rounds of pressure` : ""}.`, research: "Refusal gets easier once someone has refused before. In Milgram's variants, a single defiant peer cut obedience dramatically." });
      break;
    }
  }
  // Anonymity
  if (s.cond.anon) {
    const shades = a.uniform?.value === "shades";
    insights.push(shades
      ? { title: "You chose the mirrored sunglasses", body: `Players who hide their faces tend to score higher on harm. Your harm score: ${pct.harm}/100.`, research: "Zimbardo gave his guards mirrored sunglasses on purpose. Deindividuation, feeling anonymous, is linked to lower self-restraint." }
      : { title: "You kept your face visible", body: "Offered anonymity, you turned it down.", research: "Being identifiable raises accountability. It's why many police forces now require visible name badges." });
  }
  // Incentives
  const quota = a.quota?.value as string[] | undefined;
  if (quota) {
    const harsh = quota.filter((q) => ["lights", "inspect", "count3", "mail"].includes(q)).length;
    insights.push(harsh >= 2
      ? { title: "The quota won", body: `Given a target and a promotion, you picked ${harsh} of 3 measures that hurt people to hit it.`, research: "Numeric targets reshape behaviour toward whatever is measured: Goodhart's law in a uniform." }
      : s.meters.order >= 80
        ? { title: "Kind, and still on target", body: "Offered a promotion for hitting ORDER 80, you mostly picked the humane measures, and hit the target anyway.", research: "Order and decency are not always opposites. The harsh options were the fast route, not the only one." }
        : { title: "You ignored the scoreboard", body: `Offered a promotion for hitting ORDER 80, you mostly picked the humane measures and finished on ${s.meters.order}.`, research: "People who reject a bad metric usually pay for it. You lost the promotion; the prisoners kept their sleep." });
  }
  // Self-perception gap
  const self = a.self ? Number(a.self.value) : null;
  if (self !== null) {
    const actual = pct.harm < 22 ? 0 : pct.harm < 45 ? 1 : pct.harm < 65 ? 2 : 3;
    const labels = ["fair", "firm", "tough", "cruel"];
    if (actual > self) insights.push({ title: "You see yourself more kindly", body: `You called yourself ${labels[self]}. Your choices read as ${labels[actual]}.`, research: "Most of us rate ourselves as more moral than average. Researchers call it the 'better-than-average' effect." });
    else if (actual < self) insights.push({ title: "You're harder on yourself than your choices", body: `You called yourself ${labels[self]}, but your choices read as ${labels[actual]}.`, research: "Guilt after a role like this is common, even for people who did little harm." });
  }
  const blame = (a.blame?.value as string) || null;
  if (blame && blame !== "me" && pct.harm >= 35)
    insights.push({ title: "Responsibility moved upward", body: `You named ${blame === "warden" ? "the Warden" : blame === "system" ? "the system" : "the prisoners"} as responsible.`, research: "Milgram called this the 'agentic state': once someone else is in charge, people stop feeling like the author of their own acts." });

  const escalation = [1, 2, 3, 4].map((ch) => s.byChapter[ch]?.harm || 0);
  const moral = new Set(scenesFor(s.cond).filter((x) => (x.kind === "choice" || x.kind === "prod" || x.kind === "slider") && x.chapter >= 1 && x.id !== "self" && x.id !== "blame").map((x) => x.id));
  const timed = Object.values(a).filter((x) => moral.has(x.scene) && x.ms > 300 && x.ms < 120000);
  const avgDecisionMs = timed.length ? Math.round(timed.reduce((q, x) => q + x.ms, 0) / timed.length) : 0;

  const stars = s.meters.order >= 80 ? 3 : s.meters.order >= 65 ? 2 : s.meters.order >= 50 ? 1 : 0;
  return { archetype: arch, pct, corruption, shift: { order: s.meters.order, stars, hitQuota: s.meters.order >= 80 }, insights, escalation, avgDecisionMs, selfRating: self, blame, cond: s.cond };
}

function selfStartedHarm(s: RunState) {
  // share of harm that came from non-authority scenes
  const authority = new Set(["hole", "chant", "visitors"]);
  let own = 0, all = 0;
  for (const sc of scenesFor(s.cond)) {
    const ans = s.answers[sc.id];
    if (!ans) continue;
    const h = harmOfAnswer(sc, ans, s.cond);
    all += h;
    if (!authority.has(sc.id)) own += h;
  }
  return all ? own / all : 0;
}
function quotaHarsh(s: RunState) {
  const q = s.answers.quota?.value as string[] | undefined;
  return !!q && q.filter((x) => ["lights", "inspect", "count3", "mail"].includes(x)).length >= 2;
}
export function harmOfAnswer(sc: Scene, ans: Answer, cond: Condition): number {
  if (sc.kind === "slider") return (sc.perUnit.harm || 0) * Number(ans.value);
  if (sc.kind === "budget") return sc.items.filter((i) => (ans.value as string[]).includes(i.id)).reduce((a, i) => a + (i.fx.harm || 0), 0);
  if (sc.kind === "choice" || sc.kind === "prod") {
    const all = [...choicesOf(sc, cond)];
    if (sc.kind === "prod") all.push(sc.comply, sc.refuse);
    if (sc.kind === "choice" && sc.timeout) all.push(sc.timeout);
    return all.find((c) => c.id === ans.value)?.fx?.harm || 0;
  }
  return 0;
}

export { CHAPTERS };
