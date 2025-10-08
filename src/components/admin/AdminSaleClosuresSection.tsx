import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminSaleClosuresSection() {
  const [closures, setClosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingClosure, setViewingClosure] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchClosures();
  }, []);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code),
          validated_by_profile:profiles!validated_by(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClosures(data || []);
    } catch (error: any) {
      console.error("Error al obtener cierres:", error);
      toast.error("Error al cargar los cierres de venta");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validated":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Validado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Rechazado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> Pendiente
          </Badge>
        );
    }
  };

  const handleValidate = async (closureId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("sale_closures")
        .update({
          status: "validated",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
        })
        .eq("id", closureId);

      if (error) throw error;

      // Obtener el closure actualizado con todas las relaciones
      const { data: updatedClosure } = await supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code),
          validated_by_profile:profiles!validated_by(full_name)
        `)
        .eq("id", closureId)
        .single();

      if (updatedClosure && viewingClosure?.id === closureId) {
        setViewingClosure(updatedClosure);
      }

      toast.success("✅ Cierre validado exitosamente");
      fetchClosures();
    } catch (error: any) {
      console.error("Error al validar:", error);
      toast.error("Error al validar el cierre");
    }
  };

  const handleReject = async (closureId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Debe ingresar un motivo de rechazo");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("sale_closures")
        .update({
          status: "rejected",
          validated_by: user.id,
          validated_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", closureId);

      if (error) throw error;

      // Obtener el closure actualizado con todas las relaciones
      const { data: updatedClosure } = await supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code),
          validated_by_profile:profiles!validated_by(full_name)
        `)
        .eq("id", closureId)
        .single();

      if (updatedClosure && viewingClosure?.id === closureId) {
        setViewingClosure(updatedClosure);
      }

      toast.success("❌ Cierre rechazado");
      setShowRejectDialog(false);
      setRejectionReason("");
      fetchClosures();
    } catch (error: any) {
      console.error("Error al rechazar:", error);
      toast.error("Error al rechazar el cierre");
    }
  };

  const totalClosures = closures.length;
  const totalSales = closures.reduce((sum, c) => sum + parseFloat(c.closure_price || 0), 0);
  const pendingCount = closures.filter((c) => c.status === "pending").length;
  const validatedCount = closures.filter((c) => c.status === "validated").length;
  const rejectedCount = closures.filter((c) => c.status === "rejected").length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando cierres de venta...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Cierres */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Cierres de Venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Cierres</p>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{totalClosures}</p>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Ventas Totales</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400 flex items-center justify-center gap-1">
                <DollarSign className="h-5 w-5" />
                {totalSales.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
            </div>
            <div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Validados</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{validatedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Cierres */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Cierres</CardTitle>
        </CardHeader>
        <CardContent>
          {closures.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay cierres registrados aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Propiedad</TableHead>
                    <TableHead>Agente Captador</TableHead>
                    <TableHead>Agente Vendedor</TableHead>
                    <TableHead>Precio Cierre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closures.map((closure) => (
                    <TableRow key={closure.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(closure.closure_date), "dd/MM/yyyy", { locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{closure.property?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {closure.property?.property_code || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{closure.agent_captador?.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{closure.agent_vendedor?.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">
                          {closure.currency} {parseFloat(closure.closure_price).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(closure.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingClosure(closure)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={!!viewingClosure} onOpenChange={() => setViewingClosure(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cierre de Venta</DialogTitle>
          </DialogHeader>
          {viewingClosure && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Inmueble</label>
                  <p className="font-semibold">{viewingClosure.property?.title}</p>
                  <p className="text-sm text-muted-foreground">{viewingClosure.property?.address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">{getStatusBadge(viewingClosure.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Precio Publicado</label>
                  <p className="font-semibold">
                    {viewingClosure.currency} {parseFloat(viewingClosure.published_price).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Precio de Cierre</label>
                  <p className="font-semibold text-lg text-green-600">
                    {viewingClosure.currency} {parseFloat(viewingClosure.closure_price).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de Cierre</label>
                  <p className="font-semibold">
                    {format(new Date(viewingClosure.closure_date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Operación</label>
                  <p className="font-semibold capitalize">
                    {viewingClosure.transaction_type === "sale" ? "Venta" : "Alquiler"}
                  </p>
                </div>
              </div>

              {/* Agentes */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agente Captador</label>
                  <p className="font-semibold">{viewingClosure.agent_captador?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{viewingClosure.agent_captador?.agent_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agente Vendedor</label>
                  <p className="font-semibold">{viewingClosure.agent_vendedor?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{viewingClosure.agent_vendedor?.agent_code}</p>
                </div>
              </div>

              {/* División de Ingresos */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  División de Ingresos
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded">
                    <p className="text-muted-foreground mb-1">Oficina ({viewingClosure.office_percentage}%)</p>
                    <p className="text-xl font-bold text-blue-600">
                      {viewingClosure.currency} {parseFloat(viewingClosure.office_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded">
                    <p className="text-muted-foreground mb-1">Captador ({viewingClosure.captador_percentage}%)</p>
                    <p className="text-xl font-bold text-green-600">
                      {viewingClosure.currency} {parseFloat(viewingClosure.captador_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded">
                    <p className="text-muted-foreground mb-1">Vendedor ({viewingClosure.vendedor_percentage}%)</p>
                    <p className="text-xl font-bold text-purple-600">
                      {viewingClosure.currency} {parseFloat(viewingClosure.vendedor_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {viewingClosure.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas Adicionales</label>
                  <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{viewingClosure.notes}</p>
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Documentos Adjuntos</label>
                <div className="flex flex-wrap gap-2">
                  {viewingClosure.contract_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(viewingClosure.contract_url, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Contrato
                    </Button>
                  )}
                  {viewingClosure.voucher_urls?.map((url: string, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Comprobante {i + 1}
                    </Button>
                  ))}
                  {!viewingClosure.contract_url && !viewingClosure.voucher_urls?.length && (
                    <p className="text-sm text-muted-foreground">No hay documentos adjuntos</p>
                  )}
                </div>
              </div>

              {/* Información de Validación */}
              {viewingClosure.validated_at && (
                <div className={`p-4 rounded-lg ${
                  viewingClosure.status === "validated" 
                    ? "bg-green-50 dark:bg-green-950 border border-green-200" 
                    : "bg-red-50 dark:bg-red-950 border border-red-200"
                }`}>
                  <p className="text-sm font-medium mb-1">
                    {viewingClosure.status === "validated" ? "✅ Validado" : "❌ Rechazado"} por{" "}
                    <span className="font-semibold">{viewingClosure.validated_by_profile?.full_name || "Administrador"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(viewingClosure.validated_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                  {viewingClosure.status === "rejected" && viewingClosure.rejection_reason && (
                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Motivo del rechazo:</p>
                      <p className="text-sm">{viewingClosure.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de Acción */}
              {viewingClosure.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleValidate(viewingClosure.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validar Cierre
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar Cierre
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Rechazo */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rechazar Cierre de Venta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-medium">
                Motivo del Rechazo *
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explique el motivo por el cual se rechaza este cierre..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este motivo será visible para los agentes involucrados
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleReject(viewingClosure?.id)}
                variant="destructive"
                className="flex-1"
                disabled={!rejectionReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
