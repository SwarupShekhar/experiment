"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { addPlayer, createRoom, emote as emoteFn, markLeft, setHost, startGame, submit, tick, backToLobby, type Act, type Room, type Settings } from "@/lib/party/engine";
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
const HOST_TIMEOUT = 9000; // no word from host this long → another player takes over
const saveKey = (code: string) => "b9_room_" + code;

function restore(code: string, me: { id: string; name: string }): Room {
  try { const r = JSON.parse(sessionStorage.getItem(saveKey(code)) || "null") as Room | null; if (r && r.hostId === me.id && r.code === code) return r; } catch {}
  return createRoom(code, me.id, me.name);
}

export function useRoom(opts: { code: string; me: { id: string; name: string }; host: boolean; online: boolean }) {
  const { code, me, online } = opts;
  const [isHost, setIsHost] = useState(opts.host);
  const [room, setRoom] = useState<Room | null>(() => (opts.host ? restore(code, me) : null));
  const [status, setStatus] = useState<Status>(online ? "connecting" : "offline");
  const [skew, setSkew] = useState(0);
  const ref = useRef<Room | null>(room);
  const hostRef = useRef(opts.host);
  const ch = useRef<Channel | null>(null);
  const peers = useRef<Peer[]>([]);
  const lastHostWord = useRef(Date.now());
  const lastSent = useRef(0);

  const persist = (r: Room) => { if (!online || !hostRef.current) return; try { sessionStorage.setItem(saveKey(code), JSON.stringify(r)); } catch {} };
  const publish = useCallback((r: Room) => { ref.current = r; setRoom(r); persist(r); lastSent.current = Date.now(); ch.current?.send("state", { room: r, sentAt: Date.now() }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const update = useCallback((fn: (r: Room) => Room) => { if (!hostRef.current) return; const cur = ref.current; if (!cur) return; const n = fn(cur); if (n !== cur) publish(n); }, [publish]);

  const becomeHost = useCallback((from: Room) => {
    hostRef.current = true; setIsHost(true);
    ch.current?.retrack({ id: me.id, name: me.name, host: true });
    publish(setHost(from, me.id));
  }, [me.id, me.name, publish]);
  const becomeGuest = useCallback(() => {
    hostRef.current = false; setIsHost(false);
    try { sessionStorage.removeItem(saveKey(code)); sessionStorage.removeItem("b9_host_" + code); } catch {}
    ch.current?.retrack({ id: me.id, name: me.name, host: false });
  }, [code, me.id, me.name]);

  useEffect(() => {
    if (!online) return;
    const c = joinChannel(code, { id: me.id, name: me.name, host: hostRef.current }, {
      onStatus: (s) => {
        if (s === "SUBSCRIBED") { setStatus("ready"); lastHostWord.current = Date.now(); if (hostRef.current) publish(ref.current!); else ch.current?.send("hello", { id: me.id, name: me.name }); }
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("error");
      },
      onEvent: (ev, p) => {
        const pl = p as Record<string, unknown>;
        if (ev === "state") {
          const incoming = pl.room as Room;
          if (hostRef.current) {
            // another player is hosting with newer state (we were migrated away while asleep): step down
            if (incoming.hostId !== me.id && ref.current && incoming.rev > ref.current.rev) { becomeGuest(); ref.current = incoming; setRoom(incoming); lastHostWord.current = Date.now(); }
            return;
          }
          lastHostWord.current = Date.now();
          setSkew(Date.now() - Number(pl.sentAt));
          if (!ref.current || incoming.rev >= ref.current.rev || incoming.hostId !== ref.current.hostId) { ref.current = incoming; setRoom(incoming); }
          return;
        }
        if (ev === "hb") { if (!hostRef.current) { lastHostWord.current = Date.now(); setSkew(Date.now() - Number(pl.sentAt)); } return; }
        if (!hostRef.current) return;
        if (ev === "hello") { update((r) => addPlayer(r, String(pl.id), String(pl.name))); ch.current?.send("state", { room: ref.current, sentAt: Date.now() }); }
        if (ev === "action") update((r) => submit(r, String(pl.from), pl.act as Omit<Act, "by">));
        if (ev === "emote") update((r) => emoteFn(r, String(pl.from), String(pl.text)));
      },
      onPeers: (list: Peer[]) => {
        peers.current = list;
        if (!hostRef.current) return;
        const ids = new Set(list.map((x) => x.id));
        update((r) => {
          let n = r;
          for (const x of list) if (x.id !== me.id) n = addPlayer(n, x.id, x.name);
          for (const p of n.players) if (p.human && !p.left && p.id !== me.id && !ids.has(p.id)) n = markLeft(n, p.id);
          for (const w of n.watchers || []) if (!ids.has(w.id)) n = markLeft(n, w.id);
          return n;
        });
      },
    });
    ch.current = c;
    if (!c) setStatus("error");
    return () => { c?.close(); ch.current = null; };
  }, [code, me.id, me.name, online]); // eslint-disable-line react-hooks/exhaustive-deps

  // host: game clock + heartbeat
  useEffect(() => {
    if (!isHost) return;
    const t = setInterval(() => {
      update((r) => tick(r, Date.now()));
      if (online && Date.now() - lastSent.current > 2500) { lastSent.current = Date.now(); ch.current?.send("hb", { sentAt: Date.now() }); }
    }, 500);
    return () => clearInterval(t);
  }, [isHost, online, update]);

  // guest: host watchdog + migration
  useEffect(() => {
    if (isHost || !online) return;
    const t = setInterval(() => {
      const r = ref.current;
      const silent = Date.now() - lastHostWord.current;
      if (!r) { if (silent > 20000) setStatus("host-gone"); return; }
      if (silent < HOST_TIMEOUT) { setStatus((s) => (s === "host-gone" ? "ready" : s)); return; }
      // deterministic election among connected humans still in the room
      const present = new Set(peers.current.map((p) => p.id));
      const eligible = [...r.players.filter((p) => p.human && !p.left).map((p) => p.id), ...(r.watchers || []).map((w) => w.id)]
        .filter((id) => id !== r.hostId && present.has(id)).sort();
      if (eligible[0] === me.id) becomeHost(r);
      else if (silent > HOST_TIMEOUT * 3) setStatus("host-gone");
    }, 1000);
    return () => clearInterval(t);
  }, [isHost, online, me.id, becomeHost]);

  const act = useCallback((a: Omit<Act, "by">) => {
    if (hostRef.current) update((r) => submit(r, me.id, a));
    else { ch.current?.send("action", { from: me.id, act: a }); setRoom((r) => (r ? { ...r, pending: { ...r.pending, [me.id]: [...(r.pending[me.id] || []), { ...a, by: me.id }] } } : r)); }
  }, [me.id, update]);
  const sendEmote = useCallback((text: string) => { if (hostRef.current) update((r) => emoteFn(r, me.id, text)); else ch.current?.send("emote", { from: me.id, text }); }, [me.id, update]);
  const start = useCallback((s: Settings) => update((r) => startGame(r, s, Date.now())), [update]);
  const lobby = useCallback(() => update((r) => backToLobby(r)), [update]);

  return { room, status, skew, isHost, act, sendEmote, start, lobby };
}
