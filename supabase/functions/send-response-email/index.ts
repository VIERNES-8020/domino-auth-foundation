import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  clientName: string;
  subject: string;
  message: string;
  notificationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, clientName, subject, message, notificationId }: EmailRequest = await req.json();

    console.log("Sending response email to:", to);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Dominio Inmobiliario <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Dominio Inmobiliario</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Respuesta a tu consulta</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hola <strong>${clientName}</strong>,
            </p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Si tienes más preguntas, no dudes en contactarnos.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Este correo fue enviado desde Dominio Inmobiliario
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create notification for client (if user system exists)
    // This would require client notification system implementation

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-response-email function:", error);
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