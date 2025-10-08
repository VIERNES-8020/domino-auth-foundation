import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DocumentFileUpload from "@/components/DocumentFileUpload";

interface SaleClosureFormProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SaleClosureForm({ agentId, onSuccess, onCancel }: SaleClosureFormProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [formData, setFormData] = useState({
    property_id: "",
    agent_captador_id: agentId,
    agent_vendedor_id: agentId,
    published_price: 0,
    closure_price: "",
    currency: "USD",
    closure_date: new Date(),
    transaction_type: "sale",
    notes: "",
    office_percentage: 30,
    captador_percentage: 35,
    vendedor_percentage: 35,
  });
  const [contractUrls, setContractUrls] = useState<string[]>([]);
  const [voucherUrls, setVoucherUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchAgents();
  }, []);

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("agent_id", agentId)
      .eq("status", "approved")
      .eq("is_archived", false);

    if (!error && data) {
      setProperties(data);
    }
  };

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, agent_code")
      .not("agent_code", "is", null);

    if (!error && data) {
      setAgents(data);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setFormData((prev) => ({
        ...prev,
        property_id: propertyId,
        published_price: property.price,
        currency: property.price_currency,
      }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("=== Iniciando registro de cierre ===");

    if (!formData.property_id || !formData.closure_price) {
      toast.error("Por favor complete todos los campos requeridos");
      return;
    }

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debe iniciar sesión para registrar un cierre");
      return;
    }

    console.log("Usuario autenticado:", user.id);

    setUploading(true);

    try {

      // Insert sale closure record
      console.log("Insertando registro de cierre...");
      const closureData = {
        property_id: formData.property_id,
        agent_captador_id: formData.agent_captador_id,
        agent_vendedor_id: formData.agent_vendedor_id,
        published_price: formData.published_price,
        closure_price: parseFloat(formData.closure_price),
        currency: formData.currency,
        closure_date: formData.closure_date.toISOString(),
        transaction_type: formData.transaction_type,
        office_percentage: formData.office_percentage,
        captador_percentage: formData.captador_percentage,
        vendedor_percentage: formData.vendedor_percentage,
        notes: formData.notes,
        contract_url: contractUrls.length > 0 ? contractUrls[0] : null,
        voucher_urls: voucherUrls.length > 0 ? voucherUrls : null,
      };

      console.log("Datos a insertar:", closureData);

      const { data, error } = await supabase.from("sale_closures").insert([closureData]).select();

      if (error) {
        console.error("Error de Supabase:", error);
        throw error;
      }

      console.log("Cierre registrado exitosamente:", data);
      toast.success("Cierre de venta registrado exitosamente");
      onSuccess();
    } catch (error: any) {
      console.error("=== Error al registrar cierre ===");
      console.error("Tipo:", error.constructor.name);
      console.error("Mensaje:", error.message);
      console.error("Detalles:", error);
      
      let errorMessage = "Error al registrar el cierre de venta";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      } else if (error.hint) {
        errorMessage = error.hint;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      console.log("=== Fin del proceso ===");
    }
  };

  const calculatedAmounts = {
    office: (parseFloat(formData.closure_price || "0") * formData.office_percentage) / 100,
    captador: (parseFloat(formData.closure_price || "0") * formData.captador_percentage) / 100,
    vendedor: (parseFloat(formData.closure_price || "0") * formData.vendedor_percentage) / 100,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Inmueble */}
      <div className="space-y-2">
        <Label htmlFor="property">Inmueble *</Label>
        <Select value={formData.property_id} onValueChange={handlePropertyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar inmueble" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.title} - {property.price_currency} {property.price}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Precio Publicado (readonly) */}
      {selectedProperty && (
        <div className="space-y-2">
          <Label>Precio Publicado</Label>
          <Input
            value={`${formData.currency} ${formData.published_price.toLocaleString()}`}
            disabled
            className="bg-muted"
          />
        </div>
      )}

      {/* Precio de Cierre */}
      <div className="space-y-2">
        <Label htmlFor="closure_price">Precio de Cierre *</Label>
        <Input
          id="closure_price"
          type="number"
          step="0.01"
          value={formData.closure_price}
          onChange={(e) => setFormData({ ...formData, closure_price: e.target.value })}
          placeholder="Ingrese el precio final de cierre"
        />
      </div>

      {/* Fecha de Cierre */}
      <div className="space-y-2">
        <Label>Fecha de Cierre *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.closure_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.closure_date ? format(formData.closure_date, "PPP") : <span>Seleccionar fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.closure_date}
              onSelect={(date) => date && setFormData({ ...formData, closure_date: date })}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Tipo de Operación */}
      <div className="space-y-2">
        <Label htmlFor="transaction_type">Tipo de Operación</Label>
        <Select
          value={formData.transaction_type}
          onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sale">Venta</SelectItem>
            <SelectItem value="rent">Alquiler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agente Captador */}
      <div className="space-y-2">
        <Label>Agente Captador *</Label>
        <Select
          value={formData.agent_captador_id}
          onValueChange={(value) => setFormData({ ...formData, agent_captador_id: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.full_name} ({agent.agent_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agente Vendedor */}
      <div className="space-y-2">
        <Label>Agente Vendedor *</Label>
        <Select
          value={formData.agent_vendedor_id}
          onValueChange={(value) => setFormData({ ...formData, agent_vendedor_id: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.full_name} ({agent.agent_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* División de Ingresos */}
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h3 className="font-semibold">División de Ingresos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Oficina ({formData.office_percentage}%)</Label>
            <p className="text-lg font-bold">
              {formData.currency} {calculatedAmounts.office.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className="text-sm">Captador ({formData.captador_percentage}%)</Label>
            <p className="text-lg font-bold">
              {formData.currency} {calculatedAmounts.captador.toLocaleString()}
            </p>
          </div>
          <div>
            <Label className="text-sm">Vendedor ({formData.vendedor_percentage}%)</Label>
            <p className="text-lg font-bold">
              {formData.currency} {calculatedAmounts.vendedor.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Subir Contrato */}
      <div className="space-y-2">
        <Label>Contrato (PDF)</Label>
        <DocumentFileUpload
          files={contractUrls}
          onFilesChange={setContractUrls}
          type="contract"
          maxFiles={1}
          maxSizeMB={5}
          bucket="sale-documents"
          label="Subir Contrato"
          description="Arrastra o selecciona el contrato de venta en formato PDF"
          agentId={agentId}
        />
      </div>

      {/* Subir Comprobantes */}
      <div className="space-y-2">
        <Label>Comprobantes (Recibos/Vouchers)</Label>
        <DocumentFileUpload
          files={voucherUrls}
          onFilesChange={setVoucherUrls}
          type="voucher"
          maxFiles={10}
          maxSizeMB={5}
          bucket="sale-documents"
          label="Subir Comprobantes"
          description="Arrastra o selecciona hasta 10 comprobantes (PDF, JPG, PNG)"
          agentId={agentId}
        />
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observaciones, condiciones especiales, etc."
          rows={4}
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Guardando..." : "Guardar Cierre"}
        </Button>
      </div>
    </form>
  );
}
