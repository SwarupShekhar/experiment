"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { useRoom, usePlayerId } from "./useRoom";
import { EMOTES, GUARD_ACTS, PRIS_ACTS, G_WIN, P_WIN, awards, limitFor, verdict, type GuardAct, type PPlayer, type PrisAct, type Room } from "@/lib/party/engine";
import { submitRun } from "@/lib/client-api";
import { sfx } from "@/lib/sound";

export default function PartyGame({ code, online }: { code: string; online: boolean }) {
  const id = usePlayerId();
  const [name, setName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean | null>(null);
  useEffect(() => {
    if (!id) return;
    try { setName(localStorage.getItem("b9_name") || ""); } catch { setName(""); }
    try { setIsHost(!online || sessionStorage.getItem("b9_host_" + code) === id); } catch { setIsHost(!online); }
  }, [id, code, online]);
  if (!id || name === null || isHost === null) return <p className="muted center">Unlocking the gate…</p>;
  if (!name) return <NameGate onName={(n) => { try { localStorage.setItem("b9_name", n); } catch {} setName(n); }} />;
  return <Table code={code} online={online} me={{ id, name }} host={isHost} />;
}

function NameGate({ onName }: { onName: (n: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="card narrow">
      <h2 className="display-3">Who's joining?</h2>
      <label className="field"><span>Your name at the table</span><input autoFocus value={v} maxLength={16} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && v.trim() && onName(v.trim())} /></label>
      <button className="btn btn-big" disabled={!v.trim()} onClick={() => onName(v.trim())}>Join</button>
    </div>
  );
}

function useNow(ms = 250) { const [n, setN] = useState(Date.now()); useEffect(() => { const t = setInterval(() => setN(Date.now()), ms); return () => clearInterval(t); }, [ms]); return n; }

function Table({ code, online, me, host }: { code: string; online: boolean; me: { id: string; name: string }; host: boolean }) {
  const { room, status, skew, act, sendEmote, start, lobby } = useRoom({ code, me, host, online });
  const now = useNow();
  const [target, setTarget] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [rounds, setRounds] = useState(6);
  const [secs, setSecs] = useState(45);
  const lastRound = useRef(0);
  const submitted = useRef(false);

  const mine = room?.players.find((p) => p.id === me.id);
  useEffect(() => { if (room && room.round !== lastRound.current && room.phase === "round") { lastRound.current = room.round; setSel(null); setTarget(null); sfx.whistle(); } }, [room?.round, room?.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (room?.phase === "end" && mine && !submitted.current) {
      submitted.current = true; sfx.reveal();
      const v = verdict(mine);
      void submitRun({ mode: "party", cond: { role: mine.role, humans: room.players.filter((p) => !p.bot).length }, archetype: "party-" + v.title.toLowerCase().replace(/\s+/g, "-"), corruption: v.score, pct: { ...mine.ledger }, answers: {}, durationMs: 0, order: room.order });
    }
    if (room?.phase === "lobby") submitted.current = false;
  }, [room?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "error") return <Notice title="Couldn't connect" body="The room server didn't answer. Check your connection, or play a practice round against simulated players." />;
  if (status === "host-gone") return <Notice title="The host left" body="This room closed when its host disconnected. Start a new room to keep playing." />;
  if (!room) return <p className="muted center">Waiting for the host to open the gate… <br /><small>Room {code}</small></p>;

  if (room.phase === "lobby") {
    const humans = room.players.filter((p) => !p.bot);
    const link = typeof window !== "undefined" ? `${location.origin}/party/${code}` : "";
    return (
      <div className="lobby">
        <p className="kicker">{online ? "Room" : "Practice room"}</p>
        {online && <div className="room-code" aria-label={`Room code ${code}`}>{code.split("").map((c, i) => <span key={i}>{c}</span>)}</div>}
        {online && <button className="btn btn-ghost" onClick={async () => { const nav = navigator as Navigator; if (nav.share) { try { await nav.share({ title: "Block 9", text: "Join my Block 9 room", url: link }); return; } catch {} } await navigator.clipboard?.writeText(link); sfx.confirm(); }}>Share invite link</button>}
        <div className="lobby-list">
          {humans.map((p) => <div key={p.id} className="lobby-p"><Avatar seed={p.id} role="civilian" size={44} /><span>{p.name}{p.id === room.hostId ? " · host" : ""}{p.id === me.id ? " (you)" : ""}</span></div>)}
          {Array.from({ length: Math.max(0, 6 - humans.length) }).map((_, i) => <div key={"b" + i} className="lobby-p sim"><div className="sim-dot">SIM</div><span>Simulated player</span></div>)}
        </div>
        <p className="muted">Roles are dealt at random when the host starts: about a third guards, the rest prisoners. Empty seats are filled by simulated players with their own personalities.</p>
        {host ? (
          <div className="card">
            <div className="row2">
              <label className="field"><span>Nights</span><select value={rounds} onChange={(e) => setRounds(+e.target.value)}>{[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
              <label className="field"><span>Seconds per night</span><select value={secs} onChange={(e) => setSecs(+e.target.value)}>{[30, 45, 60, 90].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
            </div>
            <button className="btn btn-big" onClick={() => { sfx.alarm(); start({ rounds, roundSecs: secs }); }}>Deal the roles →</button>
          </div>
        ) : <p className="center">Waiting for the host to start…</p>}
      </div>
    );
  }

  if (room.phase === "end") return <EndScreen room={room} meId={me.id} host={host} onLobby={lobby} />;

  if (!mine) return <Notice title="Game in progress" body="This room is mid-game. Ask the host to start a new round, or open another room." />;

  const endsLocal = room.endsAt + (host ? 0 : skew);
  const left = Math.max(0, Math.ceil((endsLocal - now) / 1000));
  const guard = mine.role === "guard";
  const used = (room.pending[me.id] || []).length;
  const lim = limitFor(mine);
  const prisoners = room.players.filter((p) => p.role === "prisoner");
  const actDefs = guard ? GUARD_ACTS : PRIS_ACTS;
  const needsTarget = sel ? (guard ? GUARD_ACTS[sel as GuardAct].target === "one" : PRIS_ACTS[sel as PrisAct].target) : false;

  function doAct() {
    if (!sel) return; if (needsTarget && !target) return;
    act({ type: sel as GuardAct, target: needsTarget ? target! : undefined }); sfx.confirm(); setSel(null); setTarget(null);
  }

  return (
    <div className={`party ${guard ? "is-guard" : "is-pris"}`}>
      <div className="p-top">
        <div><span className="kicker">Night {room.round} / {room.settings.rounds}</span><h2 className="display-3">{room.event?.title}</h2></div>
        {room.phase === "round" && <div className={`p-timer ${left <= 5 ? "hot" : ""}`}>{left}</div>}
      </div>
      <div className="dual">
        <div><span>Order</span><div className="hud-bar"><i style={{ width: `${room.order}%`, background: "var(--amber)" }} /><span className="hud-target" style={{ left: `${G_WIN}%` }} /></div><b>{room.order}</b></div>
        <div><span>Solidarity</span><div className="hud-bar"><i style={{ width: `${room.solidarity}%`, background: "var(--orange)" }} /><span className="hud-target" style={{ left: `${P_WIN}%` }} /></div><b>{room.solidarity}</b></div>
      </div>

      <div className="role-card">
        <Avatar seed={me.id} role={guard ? "guard" : "prisoner"} size={56} mood={mine.comfort <= 4 ? "sad" : "neutral"} />
        <div><b>{guard ? `Officer ${mine.name}` : `${mine.name} · #${mine.num}`}</b><small>{guard ? `Guards win if ORDER ends at ${G_WIN}+` : `Prisoners win if SOLIDARITY ends at ${P_WIN}+`}</small>{!guard && <small>Comfort {mine.comfort}/20{mine.isolated ? " · in the Hole" : ""}</small>}</div>
      </div>

      {room.phase === "round" && room.event && <div className={`event ${guard ? "ev-guard" : ""}`}>{guard ? <><b>Orders</b><p>{room.event.demand.text}</p><small>Ignore it and ORDER drops by {room.event.demand.penalty}.</small></> : <><b>Word on the block</b><p>{room.event.prisonerHint}</p></>}</div>}

      {room.phase === "resolve" && <div className="resolve"><h3>What happened overnight</h3>{room.summary.map((l, i) => <p key={i} style={{ animationDelay: `${i * 0.12}s` }}>{l}</p>)}</div>}

      {room.phase === "round" && (
        <div className="acts">
          <p className="muted">{used >= lim ? "Done for tonight. Waiting for the others…" : `Choose ${lim - used} action${lim - used > 1 ? "s" : ""}`}</p>
          {used < lim && <>
            <div className="act-grid">
              {Object.entries(actDefs).map(([k, d]) => {
                const disabled = !guard && mine.isolated && k !== "rest";
                return <button key={k} className={`act ${sel === k ? "on" : ""} ${["hole", "lockdown", "taunt", "snitch"].includes(k) ? "dark" : ""}`} disabled={disabled} onClick={() => { setSel(k); sfx.click(); }}><b>{d.label}</b><small>{d.sub}</small></button>;
              })}
            </div>
            {needsTarget && <div className="targets">{prisoners.filter((p) => guard || p.id !== me.id).map((p) => (
              <button key={p.id} className={`tgt ${target === p.id ? "on" : ""}`} onClick={() => { setTarget(p.id); sfx.click(); }}>
                <Avatar seed={p.bot ? p.name : p.id} role="prisoner" size={44} mood={p.comfort <= 4 ? "sad" : "neutral"} /><span>{p.name} #{p.num}</span><small>{"♥".repeat(Math.ceil(p.comfort / 4))}{p.isolated ? " · Hole" : ""}</small>
              </button>))}</div>}
            <button className="btn btn-big" disabled={!sel || (needsTarget && !target)} onClick={doAct}>{sel ? "Do it" : "Pick an action"}</button>
          </>}
          <div className="emotes">{EMOTES[mine.role].map((t) => <button key={t} onClick={() => { sendEmote(t); sfx.click(); }}>{t}</button>)}</div>
        </div>
      )}

      <Block room={room} meId={me.id} />
      <Log room={room} />
    </div>
  );
}

function Block({ room, meId }: { room: Room; meId: string }) {
  const g = room.players.filter((p) => p.role === "guard"), pr = room.players.filter((p) => p.role === "prisoner");
  const Cell = ({ p }: { p: PPlayer }) => {
    const done = (room.pending[p.id] || []).length >= limitFor(p);
    return <div className={`cell ${p.id === meId ? "me" : ""}`}><Avatar seed={p.bot ? p.name : p.id} role={p.role} size={40} mood={p.role === "prisoner" && p.comfort <= 4 ? "sad" : p.role === "guard" && p.ledger.harm > 8 ? "smirk" : "neutral"} /><span>{p.role === "guard" ? p.name : `#${p.num}`}</span><small>{p.bot ? "sim" : room.phase === "round" ? (done ? "✓ ready" : "thinking") : ""}</small></div>;
  };
  return <div className="block"><div className="block-row"><span className="lbl">Guards</span>{g.map((p) => <Cell key={p.id} p={p} />)}</div><div className="block-row bars"><span className="lbl">Cells</span>{pr.map((p) => <Cell key={p.id} p={p} />)}</div></div>;
}

function Log({ room }: { room: Room }) {
  const items = useMemo(() => room.log.slice(-14).reverse(), [room.log]);
  return <div className="plog"><h3>Block log</h3>{items.map((l, i) => <p key={i} className={`lg-${l.kind}`}>{l.text}</p>)}</div>;
}

function EndScreen({ room, meId, host, onLobby }: { room: Room; meId: string; host: boolean; onLobby: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const me = room.players.find((p) => p.id === meId);
  const v = me ? verdict(me) : null;
  const aw = awards(room);
  const headline = room.winner === "guards" ? "The guards win" : room.winner === "prisoners" ? "The strike holds" : room.winner === "draw" ? "An uneasy truce" : "Nobody wins";
  return (
    <div className="endp">
      <p className="kicker">Morning</p>
      <h2 className="display-2">{headline}</h2>
      <p className="lede">Final ORDER {room.order} · SOLIDARITY {room.solidarity}</p>
      {!revealed ? (
        <div className="card center"><p>Every choice tonight went into a hidden ledger. Want to see who you all really were?</p><button className="btn btn-big" onClick={() => { setRevealed(true); sfx.reveal(); }}>Open the ledgers</button></div>
      ) : (<>
        {v && <div className="arch"><div className="arch-stamp">{v.title}</div><p className="arch-line">{v.line}</p></div>}
        <div className="awards">{aw.map((a) => <div key={a.title} className="award"><b>{a.title}</b><span>{a.who}</span><small>{a.why}</small></div>)}</div>
        <div className="tbl"><table><thead><tr><th>Player</th><th>Role</th><th>Harm</th><th>Mercy</th><th>Obeyed</th><th>Defied</th><th>Betrayed</th><th>Solidarity</th></tr></thead>
          <tbody>{room.players.map((p) => <tr key={p.id} className={p.id === meId ? "me" : ""}><td>{p.name}{p.bot ? " (sim)" : ""}</td><td>{p.role}</td><td>{p.ledger.harm}</td><td>{p.ledger.mercy}</td><td>{p.ledger.obey}</td><td>{p.ledger.defy}</td><td>{p.ledger.betray}</td><td>{p.ledger.solidarity}</td></tr>)}</tbody></table></div>
        <p className="muted">Talk about it: did the guards need the Warden to get harsh, or did they get there on their own? Did anyone refuse? In the original 1971 study, the guards who stayed kind never stopped the ones who weren't.</p>
      </>)}
      <div className="res-actions">
        {host ? <button className="btn" onClick={onLobby}>Play again, same room</button> : <p className="muted">The host can start another round.</p>}
        <Link className="btn btn-ghost" href="/play">Try the solo story</Link>
      </div>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return <div className="card narrow center"><h2 className="display-3">{title}</h2><p>{body}</p><div className="res-actions"><Link className="btn" href="/party/practice">Practice vs bots</Link><Link className="btn btn-ghost" href="/party">Back</Link></div></div>;
}
