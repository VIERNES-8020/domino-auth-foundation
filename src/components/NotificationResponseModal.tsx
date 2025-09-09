import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Mail, MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NotificationResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: any;
  clientEmail?: string;
  clientName?: string;
  clientPhone?: string;
  agentProfile?: any;
}

export default function NotificationResponseModal({ 
  isOpen, 
  onClose, 
  notification,
  clientEmail,
  clientName,
  clientPhone,
  agentProfile
}: NotificationResponseModalProps) {
  const [subject, setSubject] = useState("Respuesta a tu consulta inmobiliaria");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const [systemStatus, setSystemStatus] = useState<{
    type: 'info' | 'warning' | 'error' | 'success' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSendEmail = async () => {
    console.log('🔥 === FUNCIÓN HANDLESENDEMAIL INICIADA ===');
    console.log('🔥 Subject:', subject);
    console.log('🔥 Message:', message);
    console.log('🔥 ClientInfo:', clientInfo);
    console.log('🔥 AgentProfile:', agentProfile);
    console.log('🔥 Tab activo:', activeTab);

    // Mostrar indicador de sistema
    setSystemStatus({ type: 'info', message: '🔄 Iniciando envío de correo...' });

    // Validaciones más específicas
    if (!subject || !subject.trim()) {
      console.log('❌ Subject vacío:', `"${subject}"`);
      setSystemStatus({ type: 'error', message: '❌ ERROR: El asunto del correo está vacío' });
      toast.error("El asunto del correo es obligatorio");
      return;
    }

    if (!message || !message.trim()) {
      console.log('❌ Message vacío');
      setSystemStatus({ type: 'error', message: '❌ ERROR: El mensaje está vacío' });
      toast.error("El mensaje del correo es obligatorio");
      return;
    }

    if (!clientInfo || !clientInfo.email) {
      console.log('❌ ClientInfo o email no disponible:', clientInfo);
      setSystemStatus({ type: 'error', message: '❌ ERROR: No se encontró email del cliente' });
      toast.error("No se encontró el email del cliente en la notificación");
      return;
    }

    if (!agentProfile) {
      console.log('❌ AgentProfile no disponible');
      setSystemStatus({ type: 'error', message: '❌ ERROR: No hay información del agente' });
      toast.error("No se encontró información del agente");
      return;
    }

    const agentEmail = agentProfile.assigned_corporate_email || agentProfile.email;
    if (!agentEmail) {
      console.log('❌ Agente sin email:', agentProfile);
      setSystemStatus({ type: 'error', message: '❌ ERROR: Agente sin email configurado' });
      toast.error("El agente no tiene email asignado");
      return;
    }

    console.log('✅ Todas las validaciones pasadas, procediendo a enviar...');
    setSystemStatus({ type: 'info', message: '✅ Validaciones OK - Preparando envío...' });
    setIsLoading(true);
    
    try {
      const messageWithSignature = `${message}

Saludos cordiales,
${agentProfile?.full_name || 'Tu Agente Inmobiliario'}
Asistente Inmobiliario`;

      console.log('📧 === PREPARANDO DATOS PARA ENVÍO ===');
      console.log('📧 To:', clientInfo.email);
      console.log('📧 Agent Email:', agentEmail);
      console.log('📧 Agent Name:', agentProfile.full_name);
      console.log('📧 Subject:', subject.trim());
      console.log('📧 NotificationId:', notification.id);

      console.log('🚀 === LLAMANDO A SUPABASE FUNCTION ===');
      setSystemStatus({ type: 'info', message: '🚀 Enviando correo a Supabase...' });
      
      const { data, error } = await supabase.functions.invoke('send-response-email', {
        body: {
          to: clientInfo.email,
          clientName: clientInfo.name || 'Cliente',
          subject: subject.trim(),
          message: messageWithSignature,
          notificationId: notification.id,
          agentName: agentProfile.full_name || 'Agente',
          agentEmail: agentEmail
        }
      });

      console.log('📨 === RESPUESTA RECIBIDA ===');
      console.log('📨 Data:', data);
      console.log('📨 Error:', error);

      if (error) {
        console.error('❌ Error from edge function:', error);
        setSystemStatus({ type: 'error', message: `❌ ERROR Supabase: ${error.message}` });
        throw new Error(error.message || 'Error en la función de envío');
      }

      if (!data) {
        console.error('❌ No data returned from function');
        setSystemStatus({ type: 'error', message: '❌ ERROR: Función no retornó datos' });
        throw new Error('La función no retornó datos');
      }

      if (!data.success) {
        console.error('❌ Function returned success: false');
        setSystemStatus({ type: 'error', message: `❌ ERROR: ${data.error || 'Función falló'}` });
        throw new Error(data.error || 'La función no retornó éxito');
      }

      console.log('🎉 ✅ CORREO ENVIADO EXITOSAMENTE');
      setSystemStatus({ type: 'success', message: '🎉 ✅ CORREO ENVIADO EXITOSAMENTE' });
      toast.success(`🎉 ¡Correo enviado exitosamente desde: ${agentEmail}!`, {
        duration: 5000,
      });
      
      setSubject("");
      setMessage("");
      onClose();
      
    } catch (error: any) {
      console.error('💥 ❌ ERROR COMPLETO EN HANDLESENDEMAIL:', error);
      console.error('💥 Error stack:', error.stack);
      const errorMessage = error.message || error.toString() || 'Error desconocido';
      setSystemStatus({ type: 'error', message: `💥 ERROR CRÍTICO: ${errorMessage}` });
      toast.error(`💥 Error al enviar correo: ${errorMessage}`, {
        duration: 10000,
      });
    } finally {
      console.log('🏁 Finalizando handleSendEmail, setting loading to false');
      setIsLoading(false);
      // Limpiar status después de 10 segundos si es éxito
      if (systemStatus.type === 'success') {
        setTimeout(() => setSystemStatus({ type: null, message: '' }), 10000);
      }
    }
  };

  const handleGenerateAIResponse = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('aura-generate-response', {
        body: {
          originalMessage: notification.message,
          clientName: clientName || 'Cliente',
          context: 'real_estate_response'
        }
      });

      if (error) throw error;

      setMessage(data.response);
      toast.success("🤖 Respuesta generada con AURA");
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      toast.error("Error al generar respuesta automática");
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (!clientPhone) {
      toast.error("No hay número de teléfono disponible");
      return;
    }
    
    const messageWithSignature = `${message || 'Me comunico contigo para darte más información.'}

Saludos cordiales,
${agentProfile?.full_name || 'Tu Agente Inmobiliario'}
Asistente Inmobiliario`;
    
    const whatsappMessage = encodeURIComponent(
      `Hola ${clientName || 'Cliente'}, gracias por tu interés en nuestras propiedades. ${messageWithSignature}`
    );
    
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${clientPhone.replace(/\D/g, '')}&text=${whatsappMessage}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success("📱 Abriendo WhatsApp Web");
  };

  const extractClientInfo = (notificationMessage: string) => {
    // Extraer información del cliente del mensaje de notificación
    const emailMatch = notificationMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const nameMatch = notificationMessage.match(/(?:contacto de|interés de)\s+([^(]+)/i);
    
    return {
      email: emailMatch ? emailMatch[1] : clientEmail,
      name: nameMatch ? nameMatch[1].trim() : clientName
    };
  };

  const clientInfo = extractClientInfo(notification.message);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Responder Notificación
          </DialogTitle>
          <DialogDescription>
            Envía una respuesta personalizada al cliente
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Estado del Sistema */}
        {systemStatus.type && (
          <div className={`p-3 rounded-lg border ${
            systemStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
            systemStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            systemStatus.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                systemStatus.type === 'success' ? 'bg-green-500' :
                systemStatus.type === 'error' ? 'bg-red-500' :
                systemStatus.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500 animate-pulse'
              }`} />
              <span className="text-sm font-mono">{systemStatus.message}</span>
            </div>
          </div>
        )}

        {/* Información del cliente */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Información del Cliente:</h4>
          {clientInfo.name && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">👤 {clientInfo.name}</Badge>
            </div>
          )}
          {clientInfo.email && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">📧 {clientInfo.email}</Badge>
            </div>
          )}
          {clientPhone && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">📱 {clientPhone}</Badge>
            </div>
          )}
        </div>

        {/* Mensaje original */}
        <div className="bg-muted/20 p-3 rounded-lg">
          <Label className="text-sm font-medium">Mensaje Original:</Label>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Correo
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              IA/AURA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto del Correo</Label>
              <Input
                id="subject"
                placeholder="Respuesta a tu consulta inmobiliaria"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-message">Mensaje</Label>
            <Textarea
              id="email-message"
              placeholder="Escribe tu respuesta personalizada..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Nota: Se añadirá automáticamente tu firma al final del mensaje
            </p>
            </div>
            
                <Button 
              onClick={handleSendEmail} 
              disabled={isLoading || !clientInfo.email || !subject.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Correo
            </Button>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-message">Mensaje para WhatsApp</Label>
            <Textarea
              id="whatsapp-message"
              placeholder="Hola! Gracias por tu interés en nuestras propiedades..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Nota: Se añadirá automáticamente tu firma al final del mensaje
            </p>
            </div>
            
            <Button 
              onClick={openWhatsApp} 
              disabled={!clientPhone}
              className="w-full"
              variant="outline"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Abrir WhatsApp
            </Button>
            
            {!clientPhone && (
              <p className="text-sm text-muted-foreground text-center">
                No hay número de teléfono disponible para este cliente
              </p>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4" />
                Respuesta Automática con AURA
              </h4>
              <p className="text-sm text-muted-foreground">
                Genera una respuesta profesional y personalizada automáticamente
              </p>
            </div>
            
            <Button 
              onClick={handleGenerateAIResponse} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-2 h-4 w-4" />
              )}
              Generar Respuesta con AURA
            </Button>
            
            {message && (
              <div className="space-y-2">
                <Label>Respuesta Generada:</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSendEmail} disabled={!subject.trim() || !clientInfo.email} className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por Correo
                  </Button>
                  <Button onClick={openWhatsApp} disabled={!clientPhone} variant="outline" className="flex-1">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}