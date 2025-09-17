import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

interface AssignPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (agentCode: string, reason: string) => void;
  property: {
    id: string;
    title: string;
    property_code?: string;
  } | null;
  isLoading?: boolean;
}

export default function AssignPropertyModal({
  isOpen,
  onClose,
  onAssign,
  property,
  isLoading = false
}: AssignPropertyModalProps) {
  const [agentCode, setAgentCode] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentCode.trim() || !reason.trim()) {
      return;
    }
    onAssign(agentCode.trim(), reason.trim());
  };

  const handleClose = () => {
    setAgentCode("");
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Asignar Propiedad
          </DialogTitle>
        </DialogHeader>
        
        {property && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Propiedad a asignar:</h4>
              <p className="font-semibold">{property.title}</p>
              {property.property_code && (
                <Badge variant="outline" className="text-xs font-mono bg-primary/5 border-primary/20 text-primary">
                  ID: {property.property_code}
                </Badge>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-code">Código del Agente *</Label>
                <Input
                  id="agent-code"
                  placeholder="Ej: MCAL4139"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el código del agente al que deseas asignar esta propiedad
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-reason">Motivo de Asignación *</Label>
                <Textarea
                  id="assignment-reason"
                  placeholder="Ej: Especialista en la zona, mejor disponibilidad, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || !agentCode.trim() || !reason.trim()}>
                  {isLoading ? "Asignando..." : "Asignar Propiedad"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}