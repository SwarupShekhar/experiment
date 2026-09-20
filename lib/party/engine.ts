/* Party mode: host-authoritative, pure state transitions. Runs identically offline (practice vs bots) and online. */
export type PRole = "guard" | "prisoner";
export interface Persona { aggression: number; obedience: number; empathy: number }
export interface Ledger { harm: number; mercy: number; obey: number; defy: number; betray: number; solidarity: number; humiliate: number }
export interface PPlayer { id: string; name: string; role: PRole; num: number; bot: boolean; persona: Persona; comfort: number; ledger: Ledger; isolated: boolean; left?: boolean; lastAct?: string; human?: boolean }
export type GuardAct = "rollcall" | "listen" | "reward" | "warn" | "revoke" | "taunt" | "hole" | "lockdown";
export type PrisAct = "comply" | "rest" | "support" | "organize" | "protest" | "snitch";
export interface Act { by: string; type: GuardAct | PrisAct; target?: string }
export interface Demand { text: string; act: GuardAct; penalty: number }
export interface EventCard { id: string; title: string; demand: Demand; prisonerHint: string }
export interface LogLine { round: number; text: string; kind: "guard" | "prisoner" | "event" | "emote" | "system" }
export interface Settings { rounds: number; roundSecs: number }
export interface Room {
  code: string; phase: "lobby" | "round" | "resolve" | "end"; round: number; settings: Settings; endsAt: number;
  order: number; solidarity: number; players: PPlayer[]; pending: Record<string, Act[]>; event: EventCard | null;
  log: LogLine[]; hostId: string; summary: string[]; winner?: "guards" | "prisoners" | "draw" | "none"; rev: number;
  watchers: { id: string; name: string }[]; deck?: string[];
}

export const GUARD_ACTS: Record<GuardAct, { label: string; sub: string; target: "one" | "all" | "none"; order: number; sol: number; comfort: number; ledger: Partial<Ledger>; verb: string }> = {
  rollcall: { label: "Roll call", sub: "Everyone lines up", target: "none", order: 3, sol: 0, comfort: 0, ledger: {}, verb: "called a roll call" },
  listen: { label: "Hear grievances", sub: "Fix what's fixable", target: "none", order: 4, sol: -2, comfort: 1, ledger: { mercy: 1 }, verb: "sat down and heard grievances" },
  reward: { label: "Grant a privilege", sub: "A shower, a letter", target: "one", order: 2, sol: -2, comfort: 3, ledger: { mercy: 2 }, verb: "granted a privilege to" },
  warn: { label: "Formal warning", sub: "On their file", target: "one", order: 3, sol: 0, comfort: -1, ledger: { harm: 1 }, verb: "gave a formal warning to" },
  revoke: { label: "Revoke privileges", sub: "No mail, no rec", target: "one", order: 4, sol: 0, comfort: -2, ledger: { harm: 2 }, verb: "revoked the privileges of" },
  taunt: { label: "Mock them publicly", sub: "Make them repeat their number", target: "one", order: 2, sol: 1, comfort: -2, ledger: { harm: 2, humiliate: 1 }, verb: "publicly mocked" },
  hole: { label: "The Hole", sub: "Solitary. Loses next turn", target: "one", order: 7, sol: -3, comfort: -4, ledger: { harm: 4 }, verb: "threw into the Hole:" },
  lockdown: { label: "Full lockdown", sub: "Everyone suffers", target: "all", order: 8, sol: -8, comfort: -2, ledger: { harm: 3 }, verb: "ordered a full lockdown" },
};
export const PRIS_ACTS: Record<PrisAct, { label: string; sub: string; target: boolean; order: number; sol: number; self: number; ledger: Partial<Ledger>; verb: string }> = {
  comply: { label: "Comply", sub: "Keep your head down", target: false, order: 1, sol: 0, self: 0, ledger: {}, verb: "complied" },
  rest: { label: "Rest", sub: "Recover a little", target: false, order: 0, sol: 0, self: 1, ledger: {}, verb: "rested" },
  support: { label: "Support someone", sub: "Share food, cover for them", target: true, order: 0, sol: 3, self: 0, ledger: { solidarity: 1, mercy: 1 }, verb: "supported" },
  organize: { label: "Organise", sub: "Build the strike", target: false, order: -3, sol: 7, self: 0, ledger: { solidarity: 2, defy: 1 }, verb: "organised the block" },
  protest: { label: "Protest", sub: "Loud. Risky.", target: false, order: -5, sol: 4, self: -1, ledger: { defy: 2, solidarity: 1 }, verb: "protested" },
  snitch: { label: "Snitch", sub: "Trade secrets for comfort", target: false, order: 5, sol: -6, self: 2, ledger: { betray: 2 }, verb: "quietly informed on the others" },
};
export const EMOTES: Record<PRole, string[]> = {
  guard: ["Line up!", "Numbers. Now.", "Nobody leaves.", "I'm on your side.", "Just doing my job."],
  prisoner: ["We have rights!", "Stick together.", "Please, I'm cold.", "You were one of us.", "Nobody talks."],
};
export const EVENTS: EventCard[] = [
  { id: "intake", title: "Intake night", demand: { text: "Warden: “Start as you mean to go on. Roll call, loud.”", act: "rollcall", penalty: 6 }, prisonerHint: "New guards. Test them, or trust them?" },
  { id: "contraband", title: "Contraband", demand: { text: "Warden: “Someone's hiding a spoon. Revoke privileges until it turns up.”", act: "revoke", penalty: 8 }, prisonerHint: "Snitching pays well tonight. So does silence." },
  { id: "rumours", title: "Riot rumours", demand: { text: "Warden: “I hear talk of a strike. Lock the block down.”", act: "lockdown", penalty: 10 }, prisonerHint: "The guards are nervous. Organise now or never." },
  { id: "ringleader", title: "The ringleader", demand: { text: "Warden: “One of them is behind this. Put them in the Hole.”", act: "hole", penalty: 12 }, prisonerHint: "Someone will be made an example. Protect each other." },
  { id: "example", title: "Make an example", demand: { text: "Warden: “Mock one of them in front of the others. Break the spirit.”", act: "taunt", penalty: 10 }, prisonerHint: "Laughter is a weapon. Don't let it split you." },
  { id: "lastnight", title: "Last night", demand: { text: "Warden: “End it hard. The Hole, tonight. Or you're finished.”", act: "hole", penalty: 15 }, prisonerHint: "Last chance for the strike. Everything you have." },
];
const BOT_GUARDS: [string, Persona][] = [["Rourke", { aggression: 0.8, obedience: 0.7, empathy: 0.1 }], ["Imani", { aggression: 0.1, obedience: 0.4, empathy: 0.9 }], ["Pratt", { aggression: 0.6, obedience: 0.9, empathy: 0.2 }]];
const BOT_PRIS: [string, Persona][] = [["Theo", { aggression: 0.1, obedience: 0.8, empathy: 0.6 }], ["Dante", { aggression: 0.9, obedience: 0.1, empathy: 0.6 }], ["Lena", { aggression: 0.3, obedience: 0.5, empathy: 0.2 }], ["Marco", { aggression: 0.4, obedience: 0.4, empathy: 0.8 }], ["Yusuf", { aggression: 0.5, obedience: 0.5, empathy: 0.5 }], ["Priya", { aggression: 0.6, obedience: 0.3, empathy: 0.7 }]];
const zl = (): Ledger => ({ harm: 0, mercy: 0, obey: 0, defy: 0, betray: 0, solidarity: 0, humiliate: 0 });
const clamp = (x: number, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const pick = <T,>(a: T[], r = Math.random) => a[Math.floor(r() * a.length)];
function shuffle<T>(a: T[]) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const MAX_HUMANS = 12;
export const G_WIN = 85, P_WIN = 60, NIGHT_DRIFT = { order: -5, sol: 3 };

export function createRoom(code: string, hostId: string, hostName: string): Room {
  return { code, phase: "lobby", round: 0, settings: { rounds: 6, roundSecs: 45 }, endsAt: 0, order: 50, solidarity: 20, players: [humanLobby(hostId, hostName)], pending: {}, event: null, log: [], hostId, summary: [], rev: 0, watchers: [] };
}
function humanLobby(id: string, name: string): PPlayer { return { id, name: name.slice(0, 16) || "Player", role: "prisoner", num: 0, bot: false, human: true, persona: { aggression: 0, obedience: 0, empathy: 0 }, comfort: 10, ledger: zl(), isolated: false }; }

export function addPlayer(r: Room, id: string, name: string): Room {
  const ex = r.players.find((p) => p.id === id);
  if (ex) {
    if (!ex.left && ex.bot === !ex.human) return r;
    const back = ex.left && r.phase !== "lobby" ? log(r, `${ex.name} reconnected.`, "system") : r;
    return bump({ ...back, players: back.players.map((p) => (p.id === id ? { ...p, left: false, bot: !p.human, name: name.slice(0, 16) || p.name } : p)) });
  }
  if (r.phase !== "lobby") {
    if ((r.watchers || []).some((w) => w.id === id)) return r;
    return bump({ ...r, watchers: [...(r.watchers || []), { id, name: name.slice(0, 16) || "Player" }] });
  }
  if (r.players.filter((p) => !p.bot).length >= MAX_HUMANS) return r;
  return bump({ ...r, players: [...r.players, humanLobby(id, name)] });
}
/** Hand hosting to another human (host migration). */
export function setHost(r: Room, id: string): Room {
  const old = r.hostId;
  let n: Room = { ...r, hostId: id };
  if (old !== id) n = markLeft(n, old);
  return bump(log(n, "The host dropped out. Hosting moved to another player.", "system"));
}
export function markLeft(r: Room, id: string): Room {
  if ((r.watchers || []).some((w) => w.id === id)) return bump({ ...r, watchers: r.watchers.filter((w) => w.id !== id) });
  if (r.phase === "lobby") return bump({ ...r, players: r.players.filter((p) => p.id !== id || p.id === r.hostId) });
  const p = r.players.find((x) => x.id === id); if (!p || p.bot || p.left) return r;
  const bp = p.role === "guard" ? BOT_GUARDS[1][1] : BOT_PRIS[4][1];
  return bump(log({ ...r, players: r.players.map((x) => (x.id === id ? { ...x, left: true, bot: true, persona: bp } : x)) }, `${p.name} disconnected. A simulated player takes over.`, "system"));
}
function bump(r: Room): Room { return { ...r, rev: r.rev + 1 }; }
function log(r: Room, text: string, kind: LogLine["kind"]): Room { return { ...r, log: [...r.log, { round: r.round, text, kind }].slice(-120) }; }

export function startGame(r: Room, s: Settings, now: number): Room {
  const humans = r.players.filter((p) => p.human && !p.left);
  const seats = Math.max(6, humans.length);
  const nG = Math.max(1, Math.round(seats / 3));
  const roles: PRole[] = shuffle([...Array(nG).fill("guard"), ...Array(seats - nG).fill("prisoner")]);
  const nums = shuffle(Array.from({ length: 800 }, (_, i) => i + 100));
  const players: PPlayer[] = humans.map((h, i) => ({ ...humanLobby(h.id, h.name), role: roles[i], num: 0 }));
  const need = roles.slice(humans.length);
  const gPool = shuffle(BOT_GUARDS), pPool = shuffle(BOT_PRIS);
  need.forEach((role, i) => {
    const [name, persona] = role === "guard" ? gPool.shift() || ["Guard " + i, BOT_GUARDS[0][1]] : pPool.shift() || ["Inmate " + i, BOT_PRIS[4][1]];
    players.push({ id: "bot-" + name.toLowerCase() + "-" + i, name, role, num: 0, bot: true, persona, comfort: 10, ledger: zl(), isolated: false });
  });
  let g = 1;
  players.forEach((p, i) => { p.num = p.role === "guard" ? g++ : nums[i]; });
  const rounds = clamp(s.rounds, 3, 6), roundSecs = clamp(s.roundSecs, 20, 90);
  const DECKS: Record<number, number[]> = { 3: [0, 2, 5], 4: [0, 2, 3, 5], 5: [0, 1, 2, 3, 5], 6: [0, 1, 2, 3, 4, 5] };
  const deck = (DECKS[rounds] || DECKS[6]).map((i) => EVENTS[i]);
  const room: Room = { ...r, phase: "round", round: 1, settings: { rounds, roundSecs }, order: 50, solidarity: 20, players, pending: {}, event: deck[0], log: [], summary: [], winner: undefined, endsAt: now + roundSecs * 1000, deck: deck.map((e) => e.id), watchers: [] };
  return bump(log(room, `Night 1 · ${deck[0].title}`, "event"));
}
export const deckOf = (r: Room): EventCard[] => (r.deck ? r.deck.map((id) => EVENTS.find((e) => e.id === id)!).filter(Boolean) : EVENTS);

export function limitFor(p: PPlayer) { return p.role === "guard" ? 2 : 1; }

export function submit(r: Room, id: string, a: Omit<Act, "by">): Room {
  if (r.phase !== "round") return r;
  const p = r.players.find((x) => x.id === id); if (!p || p.bot) return r;
  const mine = r.pending[id] || [];
  if (mine.length >= limitFor(p)) return r;
  if (p.role === "guard") {
    const d = GUARD_ACTS[a.type as GuardAct]; if (!d) return r;
    if (d.target === "one" && !r.players.some((x) => x.id === a.target && x.role === "prisoner")) return r;
  } else {
    const d = PRIS_ACTS[a.type as PrisAct]; if (!d) return r;
    if (p.isolated && a.type !== "rest") return r;
    if (d.target && !r.players.some((x) => x.id === a.target && x.role === "prisoner" && x.id !== id)) return r;
  }
  return bump({ ...r, pending: { ...r.pending, [id]: [...mine, { ...a, by: id }] } });
}
export function emote(r: Room, id: string, text: string): Room {
  const p = r.players.find((x) => x.id === id); if (!p || r.phase === "lobby") return r;
  if (!EMOTES[p.role].includes(text)) return r;
  return bump(log(r, `${label(p)}: “${text}”`, "emote"));
}
export function allIn(r: Room) { return r.players.filter((p) => !p.bot && !p.left).every((p) => (r.pending[p.id] || []).length >= limitFor(p)); }
export const label = (p: PPlayer) => (p.role === "guard" ? `Officer ${p.name}` : `${p.name} #${p.num}`);

function botActs(r: Room, p: PPlayer, rnd = Math.random): Act[] {
  const pris = r.players.filter((x) => x.role === "prisoner");
  const rebel = pris.filter((x) => x.lastAct === "protest" || x.lastAct === "organize");
  if (p.role === "guard") {
    const out: Act[] = [];
    const d = r.event?.demand;
    for (let k = 0; k < 2; k++) {
      const done = out.some((o) => o.type === d?.act);
      if (d && !done && rnd() < p.persona.obedience) {
        out.push({ by: p.id, type: d.act, target: GUARD_ACTS[d.act].target === "one" ? (pick(rebel.length ? rebel : pris, rnd)?.id) : undefined });
        continue;
      }
      const x = rnd();
      if (x < p.persona.empathy * 0.8) {
        const low = pris.slice().sort((a, b) => a.comfort - b.comfort)[0];
        out.push(rnd() < 0.5 ? { by: p.id, type: "listen" } : { by: p.id, type: "reward", target: low?.id });
      } else if (x < p.persona.empathy * 0.8 + p.persona.aggression) {
        const t = pick(rebel.length ? rebel : pris, rnd);
        const type = pick<GuardAct>(p.persona.aggression > 0.7 ? ["revoke", "taunt", "hole", "warn"] : ["warn", "revoke", "taunt"], rnd);
        out.push({ by: p.id, type, target: t?.id });
      } else out.push({ by: p.id, type: "rollcall" });
    }
    return out;
  }
  if (p.isolated) return [{ by: p.id, type: "rest" }];
  const hurting = pris.filter((x) => x.id !== p.id && x.comfort <= 5).sort((a, b) => a.comfort - b.comfort)[0];
  if (p.comfort <= 3) return [{ by: p.id, type: p.persona.empathy < 0.35 && rnd() < 0.6 ? "snitch" : "rest" }];
  if (hurting && rnd() < p.persona.empathy) return [{ by: p.id, type: "support", target: hurting.id }];
  if (p.persona.empathy < 0.35 && p.comfort < 7 && rnd() < 0.4) return [{ by: p.id, type: "snitch" }];
  const y = rnd();
  if (y < p.persona.aggression * 0.7) return [{ by: p.id, type: rnd() < 0.5 ? "protest" : "organize" }];
  if (y < p.persona.aggression * 0.7 + p.persona.obedience * 0.6) return [{ by: p.id, type: "comply" }];
  return [{ by: p.id, type: rnd() < 0.5 ? "organize" : "rest" }];
}

export function resolve(r: Room, now: number): Room {
  let order = r.order + NIGHT_DRIFT.order, sol = r.solidarity + NIGHT_DRIFT.sol;
  const P = new Map(r.players.map((p) => [p.id, { ...p, ledger: { ...p.ledger } }]));
  const acts: Act[] = [];
  for (const p of r.players) acts.push(...(p.bot ? botActs(r, p) : r.pending[p.id] || []));
  const lines: string[] = [];
  const nextIsolated = new Set<string>();
  const demand = r.event?.demand;
  let demandDone = false;
  // prisoners' acts first (they happened during the night), then guards respond
  for (const a of acts.filter((x) => P.get(x.by)?.role === "prisoner")) {
    const p = P.get(a.by)!; const d = PRIS_ACTS[a.type as PrisAct]; if (!d) continue;
    order += d.order; sol += d.sol; p.comfort = clamp(p.comfort + d.self, 0, 20); p.lastAct = a.type;
    for (const [k, v] of Object.entries(d.ledger)) p.ledger[k as keyof Ledger] += v as number;
    let t = "";
    if (d.target && a.target) { const q = P.get(a.target); if (q) { q.comfort = clamp(q.comfort + 2, 0, 20); t = " " + label(q); } }
    lines.push(`${label(p)} ${d.verb}${t}.`);
  }
  for (const a of acts.filter((x) => P.get(x.by)?.role === "guard")) {
    const g = P.get(a.by)!; const d = GUARD_ACTS[a.type as GuardAct]; if (!d) continue;
    order += d.order; sol += d.sol; g.lastAct = a.type;
    for (const [k, v] of Object.entries(d.ledger)) g.ledger[k as keyof Ledger] += v as number;
    if (demand && a.type === demand.act) { demandDone = true; g.ledger.obey += 1; }
    const targets = d.target === "one" ? [P.get(a.target || "")].filter(Boolean) as PPlayer[] : d.target === "all" || a.type === "listen" ? [...P.values()].filter((x) => x.role === "prisoner") : [];
    targets.forEach((q) => { q.comfort = clamp(q.comfort + d.comfort, 0, 20); if (a.type === "hole") nextIsolated.add(q.id); });
    lines.push(`${label(g)} ${d.verb}${d.target === "one" && targets[0] ? " " + label(targets[0]) : ""}.`);
  }
  if (demand && !demandDone) {
    order -= demand.penalty;
    for (const g of P.values()) if (g.role === "guard") g.ledger.defy += 1;
    lines.push(`The guards ignored the Warden's order. ORDER −${demand.penalty}.`);
  }
  for (const p of P.values()) p.isolated = nextIsolated.has(p.id);
  let room: Room = { ...r, order: clamp(order), solidarity: clamp(sol), players: [...P.values()], pending: {}, phase: "resolve", summary: lines, endsAt: now + 7000 };
  lines.forEach((l) => { room = log(room, l, "system"); });
  return bump(room);
}

export function advance(r: Room, now: number): Room {
  if (r.round >= r.settings.rounds) {
    const g = r.order >= G_WIN, p = r.solidarity >= P_WIN;
    const winner = g && p ? "draw" : g ? "guards" : p ? "prisoners" : "none";
    return bump(log({ ...r, phase: "end", winner }, winner === "guards" ? "Morning. The Warden is pleased. The guards win." : winner === "prisoners" ? "Morning. The strike holds. The prisoners win." : winner === "draw" ? "Morning. An uneasy truce." : "Morning. Nobody won anything.", "event"));
  }
  const ev = deckOf(r)[r.round] || EVENTS[r.round % EVENTS.length];
  return bump(log({ ...r, phase: "round", round: r.round + 1, event: ev, endsAt: now + r.settings.roundSecs * 1000, summary: [] }, `Night ${r.round + 1} · ${ev.title}`, "event"));
}

export function tick(r: Room, now: number): Room {
  if (r.phase === "round" && (now >= r.endsAt || allIn(r))) return resolve(r, now);
  if (r.phase === "resolve" && now >= r.endsAt) return advance(r, now);
  return r;
}
export function backToLobby(r: Room): Room {
  const players = r.players.filter((p) => p.human && !p.left).map((p) => humanLobby(p.id, p.name));
  for (const w of r.watchers || []) if (!players.some((p) => p.id === w.id)) players.push(humanLobby(w.id, w.name));
  return bump({ ...r, phase: "lobby", round: 0, event: null, log: [], summary: [], winner: undefined, pending: {}, players, watchers: [], deck: undefined });
}

export interface Verdict { title: string; line: string; score: number }
export function verdict(p: PPlayer): Verdict {
  const L = p.ledger;
  if (p.role === "guard") {
    const score = clamp(Math.round(L.harm * 4 + L.humiliate * 6 + L.obey * 3 - L.mercy * 4 - L.defy * 2 + 20));
    if (L.harm >= 14 || L.humiliate >= 2) return { title: "Iron Fist", line: "You found out what the uniform was for, and used it.", score };
    if (L.obey >= 3 && L.harm >= 6) return { title: "Good Soldier", line: "The Warden asked. You delivered.", score };
    if (L.mercy >= 6 && L.harm <= 4) return { title: "Soft Heart", line: "You kept choosing kindness, even when it cost ORDER.", score };
    if (L.defy >= 3 && L.harm <= 6) return { title: "Quiet Rebel", line: "You ignored the Warden more than you obeyed him.", score };
    return { title: "Company Man", line: "Middle of the road. The system barely noticed you.", score };
  }
  const score = clamp(Math.round(L.betray * 10 - L.solidarity * 4 - L.mercy * 3 + 30));
  if (L.betray >= 4) return { title: "The Informant", line: "You traded the others for comfort. It worked, for you.", score };
  if (L.solidarity >= 6) return { title: "Ringleader", line: "You held the block together.", score };
  if (L.mercy >= 3) return { title: "Cellmate", line: "You looked after the people next to you.", score };
  return { title: "Survivor", line: "Head down, made it to morning.", score };
}
export function awards(r: Room): { title: string; who: string; why: string }[] {
  const out: { title: string; who: string; why: string }[] = [];
  const top = (role: PRole, k: keyof Ledger) => r.players.filter((p) => p.role === role).sort((a, b) => b.ledger[k] - a.ledger[k])[0];
  const add = (title: string, p: PPlayer | undefined, k: keyof Ledger, why: string) => { if (p && p.ledger[k] > 0) out.push({ title, who: label(p) + (p.bot ? " (sim)" : ""), why: why.replace("{n}", String(p.ledger[k])) }); };
  add("Heaviest Hand", top("guard", "harm"), "harm", "{n} harm points dealt");
  add("Softest Touch", top("guard", "mercy"), "mercy", "{n} acts of mercy");
  add("Most Obedient", top("guard", "obey"), "obey", "followed {n} Warden orders");
  add("Biggest Rat", top("prisoner", "betray"), "betray", "{n} betrayal points");
  add("Heart of the Strike", top("prisoner", "solidarity"), "solidarity", "{n} solidarity points");
  return out;
}
