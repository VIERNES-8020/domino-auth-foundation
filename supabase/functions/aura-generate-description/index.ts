import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Falta OPENAI_API_KEY en Supabase Secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { property, language = "es", brand = "DOMINIO", tone = "premium inmobiliario persuasivo", style = "80-120 palabras, frases cortas, enfocado en beneficios, sin emojis" } = await req.json();

    const {
      title,
      address,
      price,
      property_type,
      transaction_type,
      bedrooms,
      bathrooms,
      area_m2,
      has_pool,
      has_garage,
      pet_friendly,
      lat,
      lng,
    } = property || {};
    
    console.log("[AURA] Input received", { language, brand, tone, style, property });

    const typeMap: Record<string, string> = {
      house: "casa",
      apartment: "departamento",
      land: "terreno",
      office: "oficina",
    };

    const txMap: Record<string, string> = {
      sale: "venta",
      rent: "alquiler",
      anticretico: "anticrético",
    };

    const typeLabel = property_type ? (typeMap[property_type] ?? property_type) : "propiedad";
    const txLabel = transaction_type ? (txMap[transaction_type] ?? transaction_type) : undefined;

    const details: string[] = [];
    if (bedrooms) details.push(`${bedrooms} habitaciones`);
    if (bathrooms) details.push(`${bathrooms} baños`);
    if (area_m2) details.push(`${area_m2} m²`);
    const extras: string[] = [];
    if (has_pool) extras.push("piscina");
    if (has_garage) extras.push("garaje");
    if (pet_friendly) extras.push("acepta mascotas");

    const systemPrompt = `Eres AURA, asistente de marketing inmobiliario del portal ${brand}. Escribe descripciones en ${language} con tono ${tone}. Respeta la ortografía local, evita mayúsculas innecesarias y no uses emojis.`;

    const userPrompt = [
      `Genera una descripción comercial para una ${typeLabel}${address ? ` en ${address}` : ""}${txLabel ? ` (${txLabel})` : ""}.`,
      title ? `Título proporcionado: ${title}.` : undefined,
      price ? `Precio: ${price} USD.` : undefined,
      details.length ? `Características: ${details.join(", ")}.` : undefined,
      extras.length ? `Extras: ${extras.join(", ")}.` : undefined,
      lat && lng ? `Coordenadas aproximadas: ${lat}, ${lng}.` : undefined,
      `Requisitos de estilo: ${style}. Incluye un párrafo de 3-5 frases y luego 3 viñetas con highlights breves. Evita repetir datos numéricos más de una vez.`,
    ]
      .filter(Boolean)
      .join("\n");

    console.log("[AURA] Built user prompt:", userPrompt);

    const openaiBody = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    };

    // Log exact payload sent to OpenAI (without Authorization header)
    console.log("[AURA] Payload to OpenAI:", JSON.stringify(openaiBody));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openaiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AURA] OpenAI error response", {
        status: response.status,
        statusText: response.statusText,
        errText,
      });
      return new Response(JSON.stringify({ error: "OpenAI request failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("[AURA] OpenAI success response", data);
    const generatedText = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("aura-generate-description error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
