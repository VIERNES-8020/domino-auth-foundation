import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ArchivePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
  propertyTitle: string;
}

export default function ArchivePropertyModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  propertyTitle 
}: ArchivePropertyModalProps) {
  const [justification, setJustification] = useState("");

  const handleConfirm = () => {
    if (!justification.trim()) {
      alert("Por favor, proporciona una justificación para archivar la propiedad.");
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
          <DialogTitle>Archivar Propiedad</DialogTitle>
          <DialogDescription>
            Estás a punto de archivar: <strong>{propertyTitle}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="justification">
              Justificación para archivar esta propiedad *
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ej: Propiedad vendida, retirada del mercado, etc."
              className="mt-2"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-primary">
              Archivar Propiedad
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}