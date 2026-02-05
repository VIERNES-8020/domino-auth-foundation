import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Plus, Edit, Check, X, Trash2 } from "lucide-react";

interface Testimonial {
  id: string;
  client_name: string;
  transaction_type: string;
  comment: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
}

export default function TestimonialManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    client_name: "",
    transaction_type: "venta",
    comment: "",
    rating: 5
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTestimonials(data || []);
    } catch (error: any) {
      toast.error('Error loading testimonials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      transaction_type: "venta",
      comment: "",
      rating: 5
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Testimonio actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([formData]);
        if (error) throw error;
        toast.success('Testimonio creado exitosamente');
      }
      
      resetForm();
      fetchTestimonials();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const toggleApproval = async (id: string, isApproved: boolean) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: !isApproved })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Testimonio ${!isApproved ? 'aprobado' : 'desaprobado'} exitosamente`);
      fetchTestimonials();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este testimonio?')) return;
    
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Testimonio eliminado exitosamente');
      fetchTestimonials();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const startEdit = (testimonial: Testimonial) => {
    setFormData({
      client_name: testimonial.client_name,
      transaction_type: testimonial.transaction_type,
      comment: testimonial.comment,
      rating: testimonial.rating
    });
    setEditingId(testimonial.id);
    setIsCreating(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando testimonios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg sm:text-2xl">Gestión de Testimonios</CardTitle>
            <Button 
              onClick={() => setIsCreating(true)} 
              disabled={isCreating}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Agregar
            </Button>
          </div>
          <CardDescription className="text-xs sm:text-sm mt-1">
            Gestiona los testimonios de clientes que aparecen en la página "Nuestros Clientes"
          </CardDescription>
        </CardHeader>
        
        {isCreating && (
          <CardContent className="px-3 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Nombre del Cliente</label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Tipo de Transacción</label>
                  <Select value={formData.transaction_type} onValueChange={(value) => setFormData({...formData, transaction_type: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="alquiler">Alquiler</SelectItem>
                      <SelectItem value="anticretico">Anticrético</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Calificación</label>
                <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({...formData, rating: parseInt(value)})}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(rating => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} {rating === 1 ? 'estrella' : 'estrellas'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">Comentario</label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  placeholder="Escriba el testimonio del cliente..."
                  rows={2}
                  required
                  className="text-sm"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" size="sm" className="text-xs sm:text-sm">
                  {editingId ? 'Actualizar' : 'Crear'} Testimonio
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetForm} className="text-xs sm:text-sm">
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-2xl">Testimonios Existentes</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {testimonials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay testimonios creados
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="border rounded-lg p-3 sm:p-4 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-sm sm:text-base truncate">{testimonial.client_name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5">{testimonial.transaction_type}</Badge>
                        <div className="flex items-center">
                          {[1,2,3,4,5].map(star => (
                            <Star
                              key={star}
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${star <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        <Badge variant={testimonial.is_approved ? "default" : "secondary"} className="text-[10px] sm:text-xs px-1.5">
                          {testimonial.is_approved ? "Aprobado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(testimonial)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={testimonial.is_approved ? "secondary" : "default"}
                        onClick={() => toggleApproval(testimonial.id, testimonial.is_approved)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        {testimonial.is_approved ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTestimonial(testimonial.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground italic">"{testimonial.comment}"</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Creado: {new Date(testimonial.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}