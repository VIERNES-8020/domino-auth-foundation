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
  agentName?: string;
  agentEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 === FUNCIÓN SEND-RESPONSE-EMAIL INICIADA ===');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📦 Request body recibido:', requestBody);
    
    const { to, clientName, subject, message, notificationId, agentName, agentEmail }: EmailRequest = requestBody;

    // Validaciones
    if (!to) {
      throw new Error('Email destinatario es requerido');
    }
    if (!subject) {
      throw new Error('Asunto del email es requerido');
    }
    if (!message) {
      throw new Error('Mensaje del email es requerido');
    }
    if (!agentEmail) {
      throw new Error('Email del agente es requerido');
    }

    console.log("📧 Enviando correo a:", to);
    console.log("👤 Email del agente:", agentEmail);
    console.log("📝 Nombre del agente:", agentName);

    // Send email using Resend - Always use agent email when available
    const fromEmail = agentEmail && agentEmail.trim() 
      ? `${agentName || 'Dominio Inmobiliario'} <${agentEmail}>` 
      : "Dominio Inmobiliario <onboarding@resend.dev>";
      
    console.log("✉️ Email desde:", fromEmail);
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
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

    console.log("✅ Respuesta de Resend:", emailResponse);

    if (emailResponse.error) {
      console.error("❌ Error de Resend:", emailResponse.error);
      throw new Error(`Error de Resend: ${emailResponse.error}`);
    }

    console.log("🎉 EMAIL ENVIADO EXITOSAMENTE!");

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      message: 'Email enviado correctamente'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("💥 ERROR COMPLETO en send-response-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);