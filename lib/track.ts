"use client";
/** Anonymous drop-off tracking: one row per play session, recording the furthest scene reached.
 *  Plain fetch to the Postgres RPC endpoint, so the game bundle doesn't pull in supabase-js. */
export function trackProgress(session: string, idx: number, scene: string, total: number, cond: object, finished = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !session) return;
  try {
    void fetch(`${url}/rest/v1/rpc/track_progress`, {
      method: "POST", keepalive: true,
      headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_id: session, p_idx: idx, p_scene: scene, p_total: total, p_cond: cond, p_finished: finished }),
    }).catch(() => {});
  } catch {}
}
