import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const anon = (
      (import.meta.env as any).VITE_SUPABASE_PUBLISHABLE_KEY ??
      (import.meta.env as any).VITE_SUPABASE_ANON_KEY
    ) as string;
    client = createClient(url, anon);
  }
  return client as SupabaseClient;
}
