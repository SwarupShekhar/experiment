"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { addPlayer, createRoom, emote as emoteFn, markLeft, startGame, submit, tick, backToLobby, type Act, type Room, type Settings } from "@/lib/party/engine";
import { joinChannel, type Channel, type Peer } from "@/lib/party/net";

export function usePlayerId() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let v: string | null = null;
    try { v = sessionStorage.getItem("b9_pid"); } catch {}
    if (!v) { v = "p-" + Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem("b9_pid", v); } catch {} }
    setId(v);
  }, []);
  return id;
}

export type Status = "connecting" | "ready" | "host-gone" | "error" | "offline";

export function useRoom(opts: { code: string; me: { id: string; name: string }; host: boolean; online: boolean }) {
  const { code, me, host, online } = opts;
  const [room, setRoom] = useState<Room | null>(() => (host ? createRoom(code, me.id, me.name) : null));
  const [status, setStatus] = useState<Status>(online ? "connecting" : "offline");
  const [skew, setSkew] = useState(0); // guest: local clock minus host clock
  const ref = useRef<Room | null>(room);
  const ch = useRef<Channel | null>(null);
  const lastHostSeen = useRef(Date.now());

  const publish = useCallback((r: Room) => { ref.current = r; setRoom(r); ch.current?.send("state", { room: r, sentAt: Date.now() }); }, []);
  const update = useCallback((fn: (r: Room) => Room) => { const cur = ref.current; if (!cur) return; const n = fn(cur); if (n !== cur) publish(n); }, [publish]);

  useEffect(() => {
    if (!online) return;
    const c = joinChannel(code, { id: me.id, name: me.name, host }, {
      onStatus: (s) => { if (s === "SUBSCRIBED") { setStatus("ready"); if (host) publish(ref.current!); else ch.current?.send("hello", { id: me.id, name: me.name }); } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("error"); },
      onEvent: (ev, p) => {
        const pl = p as Record<string, unknown>;
        if (host) {
          if (ev === "hello") { update((r) => addPlayer(r, String(pl.id), String(pl.name))); ch.current?.send("state", { room: ref.current, sentAt: Date.now() }); }
          if (ev === "action") update((r) => submit(r, String(pl.from), pl.act as Omit<Act, "by">));
          if (ev === "emote") update((r) => emoteFn(r, String(pl.from), String(pl.text)));
        } else if (ev === "state") {
          const incoming = pl.room as Room; lastHostSeen.current = Date.now();
          setSkew(Date.now() - Number(pl.sentAt));
          if (!ref.current || incoming.rev >= ref.current.rev || incoming.phase === "lobby") { ref.current = incoming; setRoom(incoming); }
        }
      },
      onPeers: (peers: Peer[]) => {
        if (host) {
          const ids = new Set(peers.map((x) => x.id));
          update((r) => {
            let n = r;
            for (const x of peers) if (x.id !== me.id) n = addPlayer(n, x.id, x.name);
            for (const p of n.players) if (!p.bot && p.id !== me.id && !ids.has(p.id)) n = markLeft(n, p.id);
            return n;
          });
        } else {
          if (peers.some((x) => x.host)) lastHostSeen.current = Date.now();
        }
      },
    });
    ch.current = c;
    if (!c) setStatus("error");
    return () => { c?.close(); ch.current = null; };
  }, [code, me.id, me.name, host, online]); // eslint-disable-line react-hooks/exhaustive-deps

  // host clock
  useEffect(() => {
    if (!host) return;
    const t = setInterval(() => update((r) => tick(r, Date.now())), 500);
    return () => clearInterval(t);
  }, [host, update]);

  // guest: detect missing host
  useEffect(() => {
    if (host || !online) return;
    const t = setInterval(() => { if (Date.now() - lastHostSeen.current > 15000) setStatus("host-gone"); else setStatus((s) => (s === "host-gone" ? "ready" : s)); }, 2000);
    return () => clearInterval(t);
  }, [host, online]);

  const act = useCallback((a: Omit<Act, "by">) => { if (host) update((r) => submit(r, me.id, a)); else { ch.current?.send("action", { from: me.id, act: a }); setRoom((r) => (r ? { ...r, pending: { ...r.pending, [me.id]: [...(r.pending[me.id] || []), { ...a, by: me.id }] } } : r)); } }, [host, me.id, update]);
  const sendEmote = useCallback((text: string) => { if (host) update((r) => emoteFn(r, me.id, text)); else ch.current?.send("emote", { from: me.id, text }); }, [host, me.id, update]);
  const start = useCallback((s: Settings) => { if (host) update((r) => startGame(r, s, Date.now())); }, [host, update]);
  const lobby = useCallback(() => { if (host) update((r) => backToLobby(r)); }, [host, update]);

  return { room, status, skew, act, sendEmote, start, lobby };
}
