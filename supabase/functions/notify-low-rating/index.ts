import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyLowRatingRequest {
  propertyId: string
  agentId: string
  rating: number
  clientName: string
  comment: string
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { propertyId, agentId, rating, clientName, comment }: NotifyLowRatingRequest = await req.json()

    // Get property details
    const { data: property, error: propertyError } = await supabaseClient
      .from('properties')
      .select('title, address')
      .eq('id', propertyId)
      .single()

    if (propertyError) {
      throw propertyError
    }

    // Create notification for the agent
    const notificationMessage = `⚠️ Reseña de baja puntuación (${rating} estrellas) recibida para la propiedad "${property.title}". Cliente: ${clientName}. Por favor revisa con gerencia para mejorar la propiedad.`

    const { error: notificationError } = await supabaseClient
      .from('agent_notifications')
      .insert({
        to_agent_id: agentId,
        from_agent_id: agentId, // Self notification for now
        property_id: propertyId,
        message: notificationMessage
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't throw here, as the review was still created successfully
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Low rating notification sent' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in notify-low-rating function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}

serve(handler)