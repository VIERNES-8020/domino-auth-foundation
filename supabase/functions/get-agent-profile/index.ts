import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (digits.length < 6) return "+*** ****";
  const country = phone.startsWith("+") ? "+" : "";
  const last4 = digits.slice(-4);
  return `${country}${"*".repeat(Math.max(3, digits.length - 4))}-${last4}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let code = url.searchParams.get("code");
  if (!code && (req.method === "POST" || req.method === "PUT")) {
    try {
      const body = await req.json();
      code = body?.code ?? null;
    } catch (_) {
      // ignore
    }
  }
  if (!code) {
    return new Response(JSON.stringify({ error: "Falta el parámetro 'code'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    const { data: authData } = await supabase.auth.getUser();
    const requesterId = authData.user?.id ?? null;

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select(
        "id, full_name, agent_code, avatar_url, title, experience_summary, education, bio, corporate_phone, facebook_url, instagram_url, linkedin_url, twitter_url, website_url"
      )
      .eq("agent_code", code)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!prof) {
      return new Response(JSON.stringify({ error: "Agente no encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let showPhone = false;
    if (requesterId) {
      // Only show full phone to clients
      const { data: hasClientRole, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: requesterId,
        _role: "client",
      });
      if (!roleErr && hasClientRole === true) showPhone = true;
    }

    const phone = prof.corporate_phone as string | null;
    const phonePublic = phone ? (showPhone ? phone : maskPhone(phone)) : null;

    // Ratings: try agent_performance first
    let avg = 0;
    let total = 0;
    const { data: perf, error: perfErr } = await supabase
      .from("agent_performance")
      .select("average_rating, total_ratings")
      .eq("agent_id", prof.id)
      .maybeSingle();
    if (!perfErr && perf) {
      avg = Number(perf.average_rating ?? 0);
      total = Number(perf.total_ratings ?? 0);
    } else {
      const { data: stats, error: rErr } = await supabase
        .from("agent_ratings")
        .select("trato_rating, asesoramiento_rating")
        .eq("agent_id", prof.id);
      if (!rErr && stats) {
        total = stats.length;
        if (total > 0) {
          const sum = stats.reduce((acc: number, r: any) => acc + (Number(r.trato_rating) + Number(r.asesoramiento_rating)) / 2, 0);
          avg = sum / total;
        }
      }
    }

    const { data: props, error: prErr } = await supabase
      .from("properties")
      .select("id, title, address, price, price_currency, image_urls")
      .eq("agent_id", prof.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (prErr) throw prErr;

    return new Response(
      JSON.stringify({
        profile: {
          id: prof.id,
          full_name: prof.full_name,
          agent_code: prof.agent_code,
          avatar_url: prof.avatar_url,
          title: prof.title,
          experience_summary: prof.experience_summary,
          education: prof.education,
          bio: prof.bio,
          corporate_phone: phonePublic,
          facebook_url: prof.facebook_url,
          instagram_url: prof.instagram_url,
          linkedin_url: prof.linkedin_url,
          twitter_url: prof.twitter_url,
          website_url: prof.website_url,
        },
        stats: { average_rating: avg, total_ratings: total },
        properties: props ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-agent-profile error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
