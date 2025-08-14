import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { name, email, phone, whatsapp, message, timestamp } = await req.json();

    console.log('Received contact message:', { name, email, phone, whatsapp, message });

    // Get all super admins to notify them
    const { data: superAdmins, error: adminError } = await supabase
      .from('super_admins')
      .select('user_id');

    if (adminError) {
      console.error('Error fetching super admins:', adminError);
      throw adminError;
    }

    // Create notification for each super admin
    if (superAdmins && superAdmins.length > 0) {
      const notifications = superAdmins.map(admin => ({
        user_id: admin.user_id,
        title: `Nuevo mensaje de contacto de ${name}`,
        message: `Email: ${email}\nTeléfono: ${phone || 'No proporcionado'}\nWhatsApp: ${whatsapp || 'No proporcionado'}\n\nMensaje: ${message}`,
        type: 'contact',
        created_at: timestamp
      }));

      const { error: notificationError } = await supabase
        .from('admin_notifications')
        .insert(notifications);

      if (notificationError) {
        console.error('Error creating notifications:', notificationError);
        // Don't throw here, still want to log the contact message
      }
    }

    // Log the contact message for record keeping
    const { error: logError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        phone,
        whatsapp,
        message,
        created_at: timestamp
      });

    if (logError) {
      console.error('Error logging contact message:', logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contact message sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in contact-message function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
