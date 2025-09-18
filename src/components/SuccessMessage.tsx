import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Phone, Mail } from "lucide-react";
import confirmationImage from "@/assets/mensaje-enviado-confirmacion.png";

interface SuccessMessageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessMessage({ isOpen, onClose }: SuccessMessageProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-4">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          {/* Success Image */}
          <div className="flex justify-center">
            <img 
              src={confirmationImage} 
              alt="Mensaje enviado con éxito"
              className="max-w-[200px] h-auto"
            />
          </div>

          {/* Success Message */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-green-700">
              ¡Mensaje Enviado con Éxito!
            </h2>
            <p className="text-muted-foreground text-sm">
              Gracias por contactarnos. Hemos recibido tu mensaje y nuestro equipo se pondrá en contacto contigo muy pronto.
            </p>
          </div>

          {/* Contact Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Tiempo de respuesta: 24-48 horas</span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>WhatsApp disponible</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>Email directo</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}