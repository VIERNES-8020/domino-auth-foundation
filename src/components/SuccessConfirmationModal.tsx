import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle, Send, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'message' | 'appointment';
  title?: string;
  description?: string;
}

export const SuccessConfirmationModal = ({ 
  isOpen, 
  onClose, 
  type,
  title,
  description 
}: SuccessConfirmationModalProps) => {
  const isMessage = type === 'message';
  const isAppointment = type === 'appointment';

  const defaultTitle = isMessage 
    ? "¡Mensaje Enviado con Éxito!" 
    : "¡Cita Agendada con Éxito!";
    
  const defaultDescription = isMessage
    ? "Tu consulta fue enviada correctamente. El agente te contactará pronto por email o teléfono."
    : "Tu solicitud de visita fue enviada correctamente. El agente te contactará para confirmar la fecha y hora.";

  const icon = isMessage ? Send : Calendar;
  const IconComponent = icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 p-8 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-teal-400/20"></div>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {/* Success animation */}
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-white/30 rounded-full mx-auto animate-ping"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 relative">
              {title || defaultTitle}
            </h2>
            
            <div className="flex items-center justify-center gap-2 text-white/90 relative">
              <IconComponent className="h-5 w-5" />
              <span className="font-medium">
                {isMessage ? "Mensaje Confirmado" : "Cita Confirmada"}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-8 text-center">
            <p className="text-gray-600 mb-6 leading-relaxed">
              {description || defaultDescription}
            </p>
            
            {/* Success indicators */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700 font-medium">
                  {isMessage ? "Mensaje enviado correctamente" : "Solicitud de visita enviada"}
                </span>
              </div>
              
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                <Send className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span className="text-sm text-blue-700 font-medium">
                  El agente te contactará pronto
                </span>
              </div>
            </div>
            
            {/* Action button */}
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Perfecto, ¡Gracias!
            </Button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};