import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactAgentRequest {
  agentId: string;
  propertyId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, propertyId, clientName, clientEmail, clientPhone, message }: ContactAgentRequest = await req.json();

    // Create agent lead
    const { data: lead, error: leadError } = await supabase
      .from('agent_leads')
      .insert({
        agent_id: agentId,
        property_id: propertyId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        message: message
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      throw leadError;
    }

    // Create notification for agent
    const notificationMessage = propertyId 
      ? `Nuevo interés de ${clientName} (${clientEmail}) en tu propiedad. Mensaje: "${message}"`
      : `Nuevo contacto de ${clientName} (${clientEmail}). Mensaje: "${message}"`;

    const { error: notificationError } = await supabase
      .from('agent_notifications')
      .insert({
        to_agent_id: agentId,
        from_agent_id: agentId, // Self-notification
        property_id: propertyId,
        message: notificationMessage
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't throw - lead was already created successfully
    }

    console.log('Agent contact processed successfully:', lead.id);

    return new Response(
      JSON.stringify({ success: true, leadId: lead.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in agent-contact function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);