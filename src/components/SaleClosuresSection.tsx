import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Eye, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SaleClosureForm from "./SaleClosureForm";

interface SaleClosuresSectionProps {
  agentId: string;
  isSuperAdmin?: boolean;
}

export default function SaleClosuresSection({ agentId, isSuperAdmin = false }: SaleClosuresSectionProps) {
  const [closures, setClosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingClosure, setViewingClosure] = useState<any>(null);

  useEffect(() => {
    fetchClosures();
  }, [agentId, isSuperAdmin]);

  const fetchClosures = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("sale_closures")
        .select(`
          *,
          property:properties(title, address, property_code),
          agent_captador:profiles!agent_captador_id(full_name, agent_code),
          agent_vendedor:profiles!agent_vendedor_id(full_name, agent_code)
        `)
        .order("created_at", { ascending: false });

      // Si no es super admin, solo mostrar cierres donde el agente participa
      if (!isSuperAdmin) {
        query = query.or(`agent_captador_id.eq.${agentId},agent_vendedor_id.eq.${agentId}`);
      }

      const { data, error } = await query;

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
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Validado</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rechazado</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
    }
  };

  const handleValidate = async (closureId: string, status: "validated" | "rejected") => {
    try {
      const { error } = await supabase
        .from("sale_closures")
        .update({
          status,
          validated_by: agentId,
          validated_at: new Date().toISOString(),
        })
        .eq("id", closureId);

      if (error) throw error;

      toast.success(`Cierre ${status === "validated" ? "validado" : "rechazado"} exitosamente`);
      fetchClosures();
      setViewingClosure(null);
    } catch (error: any) {
      console.error("Error al validar:", error);
      toast.error("Error al actualizar el estado del cierre");
    }
  };

  const totalClosures = closures.length;
  const totalSales = closures.reduce((sum, c) => sum + parseFloat(c.closure_price || 0), 0);

  return (
    <div className="space-y-4">
      {/* Tarjeta de Resumen */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Cierres de Venta</CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            📑 Registrar Cierre
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Cierres</p>
              <p className="text-2xl font-bold">{totalClosures}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventas Totales</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {totalSales.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {closures.filter((c) => c.status === "pending").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validados</p>
              <p className="text-2xl font-bold text-green-600">
                {closures.filter((c) => c.status === "validated").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cierres */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Histórico de Cierres</h3>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : closures.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay cierres registrados aún
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {closures.map((closure) => (
              <Card key={closure.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{closure.property?.title}</h4>
                          <p className="text-sm text-muted-foreground">{closure.property?.address}</p>
                        </div>
                        {getStatusBadge(closure.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Precio Cierre:</span>
                          <p className="font-semibold">
                            {closure.currency} {parseFloat(closure.closure_price).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fecha:</span>
                          <p className="font-semibold">
                            {format(new Date(closure.closure_date), "dd/MM/yyyy", { locale: es })}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tipo:</span>
                          <p className="font-semibold capitalize">{closure.transaction_type === "sale" ? "Venta" : "Alquiler"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Código:</span>
                          <p className="font-semibold">{closure.property?.property_code || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          Captador: {closure.agent_captador?.full_name}
                        </Badge>
                        <Badge variant="outline">
                          Vendedor: {closure.agent_vendedor?.full_name}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingClosure(closure)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" /> Ver Detalles
                      </Button>
                      {closure.contract_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(closure.contract_url, "_blank")}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" /> Contrato
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Cierre de Venta</DialogTitle>
          </DialogHeader>
          <SaleClosureForm
            agentId={agentId}
            onSuccess={() => {
              setShowForm(false);
              fetchClosures();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Detalles */}
      <Dialog open={!!viewingClosure} onOpenChange={() => setViewingClosure(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Cierre</DialogTitle>
          </DialogHeader>
          {viewingClosure && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Inmueble</Label>
                  <p className="font-semibold">{viewingClosure.property?.title}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Estado</Label>
                  <div className="mt-1">{getStatusBadge(viewingClosure.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Precio Publicado</Label>
                  <p className="font-semibold">
                    {viewingClosure.currency} {parseFloat(viewingClosure.published_price).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Precio de Cierre</Label>
                  <p className="font-semibold">
                    {viewingClosure.currency} {parseFloat(viewingClosure.closure_price).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Agente Captador</Label>
                  <p className="font-semibold">{viewingClosure.agent_captador?.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Agente Vendedor</Label>
                  <p className="font-semibold">{viewingClosure.agent_vendedor?.full_name}</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-3">División de Ingresos</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Oficina ({viewingClosure.office_percentage}%)</p>
                    <p className="text-lg font-bold">
                      {viewingClosure.currency} {parseFloat(viewingClosure.office_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Captador ({viewingClosure.captador_percentage}%)</p>
                    <p className="text-lg font-bold">
                      {viewingClosure.currency} {parseFloat(viewingClosure.captador_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendedor ({viewingClosure.vendedor_percentage}%)</p>
                    <p className="text-lg font-bold">
                      {viewingClosure.currency} {parseFloat(viewingClosure.vendedor_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {viewingClosure.notes && (
                <div>
                  <Label className="text-sm text-muted-foreground">Notas</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{viewingClosure.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Documentos</Label>
                <div className="flex flex-wrap gap-2">
                  {viewingClosure.contract_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(viewingClosure.contract_url, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Contrato
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
                </div>
              </div>

              {isSuperAdmin && viewingClosure.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleValidate(viewingClosure.id, "validated")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validar
                  </Button>
                  <Button
                    onClick={() => handleValidate(viewingClosure.id, "rejected")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}
