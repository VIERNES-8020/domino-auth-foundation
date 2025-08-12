import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Fallbacks for environments without Lovable's Supabase integration
const FALLBACK_URL = "https://rzsailqcijraplggryyy.supabase.co";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6c2FpbHFjaWpyYXBsZ2dyeXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTY4MzEsImV4cCI6MjA3MDUzMjgzMX0.qRAwRu7Z3KHEfoYcTUUqOuHY6KSqZ6vesfO9liAmwTE";

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url =
      (import.meta.env as any).VITE_SUPABASE_URL || FALLBACK_URL;
    const anon =
      (import.meta.env as any).VITE_SUPABASE_PUBLISHABLE_KEY ??
      (import.meta.env as any).VITE_SUPABASE_ANON_KEY ??
      FALLBACK_ANON;

    client = createClient(url as string, anon as string);
  }
  return client as SupabaseClient;
}
