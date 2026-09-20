"use client";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

let sb: SupabaseClient | null = null;
export function onlineAvailable() { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
export function supabase(): SupabaseClient | null {
  if (!onlineAvailable()) return null;
  if (!sb) sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } });
  return sb;
}
export interface Peer { id: string; name: string; host: boolean }
export interface Channel { send: (event: string, payload: unknown) => void; close: () => void }

export function joinChannel(code: string, me: Peer, h: { onEvent: (event: string, payload: unknown) => void; onPeers: (peers: Peer[]) => void; onStatus: (s: string) => void }): Channel | null {
  const c = supabase(); if (!c) return null;
  const ch: RealtimeChannel = c.channel("block9:" + code, { config: { broadcast: { self: false }, presence: { key: me.id } } });
  for (const ev of ["state", "action", "emote", "hello"]) ch.on("broadcast", { event: ev }, (m) => h.onEvent(ev, m.payload));
  ch.on("presence", { event: "sync" }, () => {
    const st = ch.presenceState<Peer>();
    const peers: Peer[] = [];
    for (const k of Object.keys(st)) { const e = st[k]?.[0]; if (e) peers.push({ id: e.id, name: e.name, host: e.host }); }
    h.onPeers(peers);
  });
  ch.subscribe(async (status) => { h.onStatus(status); if (status === "SUBSCRIBED") await ch.track(me); });
  return {
    send: (event, payload) => { void ch.send({ type: "broadcast", event, payload }); },
    close: () => { void ch.untrack(); void c.removeChannel(ch); },
  };
}
