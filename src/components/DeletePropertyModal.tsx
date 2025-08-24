import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeletePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  propertyTitle: string;
}

export default function DeletePropertyModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  propertyTitle 
}: DeletePropertyModalProps) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast.error("Ingresa la contraseña de eliminación");
      return;
    }

    if (!reason.trim()) {
      toast.error("Debes proporcionar una razón para la eliminación");
      return;
    }

    // TODO: Verificar contraseña con el Super Admin
    // Por ahora usamos una contraseña temporal: "DOMINIO2025"
    if (password !== "DOMINIO2025") {
      toast.error("Contraseña de eliminación incorrecta");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason.trim());
      setPassword("");
      setReason("");
      onClose();
    } catch (error) {
      toast.error("Error al eliminar la propiedad");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Propiedad
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la propiedad:
            <br />
            <strong>"{propertyTitle}"</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Razón de la eliminación *
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué estás eliminando esta propiedad..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deletePassword">
              Contraseña de eliminación
            </Label>
            <Input
              id="deletePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa la contraseña"
            />
            <p className="text-xs text-muted-foreground">
              Solicita la contraseña al Super Administrador
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}