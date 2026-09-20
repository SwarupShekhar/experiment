"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { onlineAvailable } from "@/lib/party/net";
import { usePlayerId } from "./useRoom";

const CH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code5 = () => Array.from({ length: 5 }, () => CH[Math.floor(Math.random() * CH.length)]).join("");

export default function PartyLobby() {
  const router = useRouter();
  const id = usePlayerId();
  const [join, setJoin] = useState("");
  const online = onlineAvailable();
  function create() {
    if (!id) return;
    const c = code5();
    try { sessionStorage.setItem("b9_host_" + c, id); } catch {}
    router.push(`/party/${c}`);
  }
  return (
    <div className="party-home">
      <p className="kicker">Party mode · 2–12 players</p>
      <h1 className="display-2">Deal the keys.</h1>
      <p className="lede">One of you opens a room, everyone else joins from their own phone. Roles are random. Guards chase ORDER, prisoners chase SOLIDARITY, and a Warden keeps making demands. At dawn, everyone&apos;s hidden ledger goes on the table.</p>
      <div className="ph-grid">
        <div className="card">
          <h3>Host a room</h3>
          <p className="muted">You&apos;ll get a five-letter code to share.</p>
          <button className="btn btn-big" onClick={create} disabled={!online || !id}>Create room</button>
          {!online && <p className="muted small">Online rooms aren&apos;t switched on for this site yet. Practice mode works.</p>}
        </div>
        <div className="card">
          <h3>Join a room</h3>
          <input className="code-in" value={join} maxLength={5} placeholder="CODE" onChange={(e) => setJoin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} onKeyDown={(e) => e.key === "Enter" && join.length === 5 && router.push(`/party/${join}`)} aria-label="Room code" />
          <button className="btn btn-big" disabled={join.length !== 5 || !online} onClick={() => router.push(`/party/${join}`)}>Join</button>
        </div>
        <div className="card">
          <h3>Practice</h3>
          <p className="muted">Just you and five simulated players, each with their own temperament.</p>
          <button className="btn btn-big btn-ghost" onClick={() => router.push("/party/practice")}>Play vs bots</button>
        </div>
      </div>
      <div className="howto">
        <h3>How a night works</h3>
        <ol>
          <li><b>The Warden issues an order.</b> Guards can obey it or ignore it and take the ORDER penalty.</li>
          <li><b>Everyone acts in secret.</b> Guards get two actions, prisoners one. From hearing grievances to the Hole; from organising a strike to snitching.</li>
          <li><b>Dawn reveals what happened.</b> Meters move, people suffer or recover, and the log remembers.</li>
          <li><b>After the last night</b> every player&apos;s hidden ledger (harm, mercy, obedience, betrayal) is revealed, with awards.</li>
        </ol>
        <p className="muted">No free-text chat, only quick lines, so nobody can actually be cruel to a real person beyond the game&apos;s menu.</p>
      </div>
    </div>
  );
}
