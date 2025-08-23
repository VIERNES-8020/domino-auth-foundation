import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateResponseRequest {
  originalMessage: string;
  clientName: string;
  context: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalMessage, clientName, context }: GenerateResponseRequest = await req.json();

    console.log("Generating AI response for:", clientName);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `Eres AURA, una asistente de inteligencia artificial especializada en respuestas inmobiliarias profesionales. 

Tu tarea es generar respuestas personalizadas y profesionales para clientes que han mostrado interés en propiedades inmobiliarias.

Características de tus respuestas:
- Profesionales pero cálidas y cercanas
- Personalizadas usando el nombre del cliente
- Enfocadas en brindar valor y siguiente paso
- Máximo 150 palabras
- Tono consultivo y experto
- Incluye una llamada a la acción clara

Contexto: ${context}
Nombre del cliente: ${clientName}`;

    const userPrompt = `Genera una respuesta profesional al siguiente mensaje de un cliente interesado en propiedades:

"${originalMessage}"

La respuesta debe:
1. Agradecer su interés
2. Ser específica al mensaje recibido
3. Ofrecer valor adicional
4. Incluir una invitación a continuar la conversación
5. Ser profesional pero cercana`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    const generatedResponse = data.choices[0].message.content;

    console.log("AI response generated successfully");

    return new Response(JSON.stringify({ 
      response: generatedResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in aura-generate-response function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});