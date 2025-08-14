import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ArchivePropertyModalProps {
  property: any; // The property to archive/unarchive
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

export default function ArchivePropertyModal({ 
  property,
  isOpen, 
  onClose, 
  onConfirm
}: ArchivePropertyModalProps) {
  const [justification, setJustification] = useState("");

  const isArchived = property?.is_archived || false;
  const propertyTitle = property?.title || "";
  const actionText = isArchived ? "Desarchivar" : "Archivar";

  const handleConfirm = () => {
    if (!isArchived && !justification.trim()) {
      alert(`Por favor, proporciona una justificación para ${actionText.toLowerCase()} la propiedad.`);
      return;
    }
    onConfirm(justification.trim());
    setJustification("");
    onClose();
  };

  const handleClose = () => {
    setJustification("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionText} Propiedad</DialogTitle>
          <DialogDescription>
            Estás a punto de {actionText.toLowerCase()}: <strong>{propertyTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="justification">
              {isArchived 
                ? "Motivo para desarchivar (opcional)" 
                : `Justificación para ${actionText.toLowerCase()} esta propiedad *`
              }
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={isArchived 
                ? "Ej: Nuevamente disponible, actualización de información, etc." 
                : "Ej: Propiedad vendida, retirada del mercado, etc."
              }
              className="mt-2"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-primary">
              {actionText} Propiedad
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}