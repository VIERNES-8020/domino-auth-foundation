import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleVisitRequest {
  propertyId: string;
  agentId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  message?: string;
  visitDate: string; // YYYY-MM-DD format
  visitTime: string; // HH:MM format
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      propertyId,
      agentId,
      clientName,
      clientEmail,
      clientPhone,
      message,
      visitDate,
      visitTime
    }: ScheduleVisitRequest = await req.json();

    console.log("Scheduling visit for property:", propertyId);

    // Get property details
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("title, address")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      throw propertyError;
    }

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from("profiles")
      .select("full_name, corporate_phone")
      .eq("id", agentId)
      .single();

    if (agentError) {
      throw agentError;
    }

    // Create the visit record
    const visitDateTime = `${visitDate}T${visitTime}:00`;
    const { data: visit, error: visitError } = await supabase
      .from("property_visits")
      .insert({
        property_id: propertyId,
        agent_id: agentId,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        message: message,
        scheduled_at: visitDateTime,
        status: "pending"
      })
      .select()
      .single();

    if (visitError) {
      throw visitError;
    }

    // Create notification for the agent (adjusted to match schema)
    try {
      await supabase
        .from("agent_notifications")
        .insert({
          from_agent_id: agentId, // System-originated; using agentId to satisfy NOT NULL
          to_agent_id: agentId,
          property_id: propertyId,
          message: `${clientName} ha solicitado una visita para ${property.title} el ${visitDate} a las ${visitTime}`,
          read: false
        });
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
    }

    console.log("Visit scheduled successfully:", visit.id);

    // TODO: Send email and WhatsApp notifications
    // This would require additional services like Resend for email and WhatsApp API

    return new Response(JSON.stringify({
      success: true,
      visitId: visit.id,
      message: "Visita agendada exitosamente"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error("Error in schedule-property-visit function:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);