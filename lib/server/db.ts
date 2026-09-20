import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * All access goes through three Postgres functions (submit_run, remove_run, recent_runs),
 * so the public anon key is enough. The runs table itself is locked (RLS on, no grants).
 * A service-role key is used if present but is not required.
 */
let client: SupabaseClient | null = null;
export function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
