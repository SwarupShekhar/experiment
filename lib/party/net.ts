"use client";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

let sb: SupabaseClient | null = null;
/** Test/dev transport: `?localnet=1` runs rooms over BroadcastChannel between tabs of one browser. */
export function localNet() {
  if (typeof window === "undefined") return false;
  try { if (new URLSearchParams(location.search).get("localnet") === "1") sessionStorage.setItem("b9_localnet", "1"); return sessionStorage.getItem("b9_localnet") === "1"; } catch { return false; }
}
export function onlineAvailable() { return localNet() || !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
export function supabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  if (!sb) sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } });
  return sb;
}
export interface Peer { id: string; name: string; host: boolean }
export interface Channel { send: (event: string, payload: unknown) => void; retrack: (me: Peer) => void; close: () => void }
type Handlers = { onEvent: (event: string, payload: unknown) => void; onPeers: (peers: Peer[]) => void; onStatus: (s: string) => void };
const EVENTS = ["state", "action", "emote", "hello", "hb"];

export function joinChannel(code: string, me: Peer, h: Handlers): Channel | null {
  if (localNet()) return joinLocal(code, me, h);
  const c = supabase(); if (!c) return null;
  const ch: RealtimeChannel = c.channel("block9:" + code, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  for (const ev of EVENTS) ch.on("broadcast", { event: ev }, (m) => h.onEvent(ev, m.payload));
  ch.on("presence", { event: "sync" }, () => {
    const st = ch.presenceState<Peer>();
    const peers: Peer[] = [];
    for (const k of Object.keys(st)) { const e = st[k]?.[0]; if (e) peers.push({ id: e.id, name: e.name, host: e.host }); }
    h.onPeers(peers);
  });
  ch.subscribe(async (status) => { h.onStatus(status); if (status === "SUBSCRIBED") await ch.track(me); });
  return {
    send: (event, payload) => { void ch.send({ type: "broadcast", event, payload }); },
    retrack: (p) => { void ch.track(p); },
    close: () => { void ch.untrack(); void c.removeChannel(ch); },
  };
}

function joinLocal(code: string, me0: Peer, h: Handlers): Channel {
  let me = me0;
  const bc = new BroadcastChannel("block9-local:" + code);
  const seen = new Map<string, { p: Peer; at: number }>();
  let last = "";
  const emitPeers = () => {
    const now = Date.now();
    for (const [k, v] of seen) if (now - v.at > 4000) seen.delete(k);
    const peers = [me, ...[...seen.values()].map((v) => v.p)];
    const sig = peers.map((p) => p.id + (p.host ? "*" : "")).sort().join(",");
    if (sig !== last) { last = sig; h.onPeers(peers); }
  };
  bc.onmessage = (m) => {
    const { t, event, payload, peer } = m.data || {};
    if (t === "presence") { seen.set(peer.id, { p: peer, at: Date.now() }); emitPeers(); }
    else if (t === "bye") { seen.delete(peer.id); emitPeers(); }
    else if (t === "msg" && EVENTS.includes(event)) h.onEvent(event, payload);
  };
  const beat = () => { bc.postMessage({ t: "presence", peer: me }); emitPeers(); };
  const iv = setInterval(beat, 1000);
  setTimeout(() => { h.onStatus("SUBSCRIBED"); beat(); }, 50);
  return {
    send: (event, payload) => bc.postMessage({ t: "msg", event, payload: JSON.parse(JSON.stringify(payload)) }),
    retrack: (p) => { me = p; beat(); },
    close: () => { clearInterval(iv); bc.postMessage({ t: "bye", peer: me }); bc.close(); },
  };
}
