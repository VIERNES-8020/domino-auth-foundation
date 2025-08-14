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
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gestión de Testimonios
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Testimonio
            </Button>
          </CardTitle>
          <CardDescription>
            Gestiona los testimonios de clientes que aparecen en la página "Nuestros Clientes"
          </CardDescription>
        </CardHeader>
        
        {isCreating && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre del Cliente</label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo de Transacción</label>
                  <Select value={formData.transaction_type} onValueChange={(value) => setFormData({...formData, transaction_type: value})}>
                    <SelectTrigger>
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
              
              <div>
                <label className="text-sm font-medium">Calificación</label>
                <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({...formData, rating: parseInt(value)})}>
                  <SelectTrigger>
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
              
              <div>
                <label className="text-sm font-medium">Comentario</label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  placeholder="Escriba el testimonio del cliente..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Actualizar' : 'Crear'} Testimonio
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Testimonios Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {testimonials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay testimonios creados
            </div>
          ) : (
            <div className="space-y-4">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{testimonial.client_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{testimonial.transaction_type}</Badge>
                        <div className="flex items-center">
                          {[1,2,3,4,5].map(star => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        <Badge variant={testimonial.is_approved ? "default" : "secondary"}>
                          {testimonial.is_approved ? "Aprobado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(testimonial)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={testimonial.is_approved ? "secondary" : "default"}
                        onClick={() => toggleApproval(testimonial.id, testimonial.is_approved)}
                      >
                        {testimonial.is_approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTestimonial(testimonial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{testimonial.comment}"</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Creado: {new Date(testimonial.created_at).toLocaleDateString()}
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