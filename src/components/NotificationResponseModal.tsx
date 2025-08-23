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
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email");

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim() || !clientEmail) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);
    try {
      const messageWithSignature = `${message}

Saludos cordiales,
${agentProfile?.full_name || 'Tu Agente Inmobiliario'}
Asistente Inmobiliario`;

      const { error } = await supabase.functions.invoke('send-response-email', {
        body: {
          to: clientEmail,
          clientName: clientName || 'Cliente',
          subject,
          message: messageWithSignature,
          notificationId: notification.id,
          agentName: agentProfile?.full_name,
          agentEmail: agentProfile?.email
        }
      });

      if (error) throw error;

      toast.success("📧 Respuesta enviada exitosamente por correo");
      setSubject("");
      setMessage("");
      onClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error("Error al enviar correo: " + error.message);
    } finally {
      setIsLoading(false);
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
              disabled={isLoading || !clientInfo.email}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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