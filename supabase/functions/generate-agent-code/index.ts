import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader ?? "" } },
  });

  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const full_name: string = (body?.full_name ?? "").toString();
    const identity_card: string = (body?.identity_card ?? "").toString();

    if (!full_name || !identity_card) {
      return new Response(JSON.stringify({ error: "Faltan datos: full_name o identity_card" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build initials (first letters up to three words)
    const initials = full_name
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((w: string) => w.charAt(0).toUpperCase())
      .join("");

    const digits = identity_card.replace(/\D+/g, "");
    const last4 = digits.slice(-4);
    let candidate = `${initials}${last4}`;

    // Try to set unique code, fallback with suffix on conflict
    let finalCode = candidate;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ agent_code: finalCode })
        .eq("id", userId);

      if (!updErr) {
        return new Response(JSON.stringify({ agent_code: finalCode }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If unique violation, try new suffix
      if (updErr.message?.toLowerCase().includes("duplicate")) {
        const suffix = Math.floor(10 + Math.random() * 90); // 2 digits
        finalCode = `${candidate}${suffix}`;
        continue;
      }

      // Other error
      console.error("generate-agent-code update error", updErr);
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // After attempts, return last code
    return new Response(JSON.stringify({ agent_code: finalCode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-agent-code error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
