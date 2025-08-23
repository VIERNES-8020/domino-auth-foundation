import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Clock, User } from "lucide-react";
import { SuccessConfirmationModal } from "@/components/SuccessConfirmationModal";

interface PropertyBookingCalendarProps {
  propertyId: string;
  agentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyBookingCalendar({ 
  propertyId, 
  agentId, 
  isOpen, 
  onClose 
}: PropertyBookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const timeSlots = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      toast.error("Por favor selecciona fecha y hora");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("schedule-property-visit", {
        body: {
          propertyId,
          agentId,
          clientName: clientData.name,
          clientEmail: clientData.email,
          clientPhone: clientData.phone,
          message: clientData.message,
          visitDate: selectedDate.toISOString().split('T')[0],
          visitTime: selectedTime
        }
      });

      if (error) throw error;

      // MOSTRAR CONFIRMACIÓN ELEGANTE
      setShowConfirmation(true);

    } catch (error) {
      console.error("Error scheduling visit:", error);
      toast.error("❌ Error al agendar cita", {
        description: "No se pudo agendar la cita. Verifica tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0; // Disable Sundays
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Agendar visita a la propiedad
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleBooking} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seleccionar fecha</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDateDisabled}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Time Selection */}
            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horarios disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-xs"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="booking-name">Nombre completo *</Label>
                  <Input
                    id="booking-name"
                    value={clientData.name}
                    onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="booking-email">Correo electrónico *</Label>
                  <Input
                    id="booking-email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@correo.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="booking-phone">Número de teléfono</Label>
                  <Input
                    id="booking-phone"
                    value={clientData.phone}
                    onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+591 70000000"
                  />
                </div>

                <div>
                  <Label htmlFor="booking-message">Mensaje adicional</Label>
                  <Textarea
                    id="booking-message"
                    value={clientData.message}
                    onChange={(e) => setClientData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="¿Hay algo específico que te gustaría ver o preguntar durante la visita?"
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {selectedDate && selectedTime && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de la visita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Fecha:</strong> {selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p><strong>Hora:</strong> {selectedTime}</p>
                    <p className="text-muted-foreground mt-4">
                      Recibirás una confirmación por correo electrónico y WhatsApp. 
                      El agente confirmará la disponibilidad en las próximas horas.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={!selectedDate || !selectedTime || !clientData.name || !clientData.email || loading}
              className="flex-1 relative"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                "🗓️ Confirmar visita"
              )}
            </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      {/* Confirmation Modal */}
      <SuccessConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setTimeout(() => {
            onClose();
            setSelectedDate(undefined);
            setSelectedTime("");
            setClientData({ name: "", email: "", phone: "", message: "" });
          }, 300);
        }}
        type="appointment"
        title={selectedDate && selectedTime ? `¡Cita Agendada para el ${selectedDate.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'long' 
        })} a las ${selectedTime}!` : undefined}
      />
    </Dialog>
  );
}