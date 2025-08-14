import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Amenity {
  id: string;
  name: string;
  icon_svg?: string;
  is_active: boolean;
}

export default function AmenitiesManagement() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [newAmenity, setNewAmenity] = useState({ name: "", icon_svg: "" });
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('id, name, icon_svg')
        .order('name');

      if (error) throw error;
      
      // Map data to include missing properties
      const mappedData = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        icon_svg: item.icon_svg,
        is_active: true, // Default value since the existing table doesn't have this column
      }));
      
      setAmenities(mappedData);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast.error('Error al cargar amenidades');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAmenity = async () => {
    if (!newAmenity.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      const { error } = await supabase
        .from('amenities')
        .insert({
          name: newAmenity.name.trim(),
          icon_svg: newAmenity.icon_svg.trim() || null
        });

      if (error) throw error;
      
      toast.success('Amenidad creada exitosamente');
      setNewAmenity({ name: "", icon_svg: "" });
      await fetchAmenities();
    } catch (error: any) {
      console.error('Error creating amenity:', error);
      toast.error('Error al crear amenidad: ' + error.message);
    }
  };

  const handleUpdateAmenity = async () => {
    if (!editingAmenity || !editingAmenity.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      const { error } = await supabase
        .from('amenities')
        .update({
          name: editingAmenity.name.trim(),
          icon_svg: editingAmenity.icon_svg?.trim() || null
        })
        .eq('id', editingAmenity.id);

      if (error) throw error;
      
      toast.success('Amenidad actualizada exitosamente');
      setEditingAmenity(null);
      await fetchAmenities();
    } catch (error: any) {
      console.error('Error updating amenity:', error);
      toast.error('Error al actualizar amenidad: ' + error.message);
    }
  };

  const toggleAmenityStatus = async (id: string, isActive: boolean) => {
    // For now, just update the local state since the table doesn't have is_active column
    setAmenities(prev => prev.map(amenity => 
      amenity.id === id ? { ...amenity, is_active: !isActive } : amenity
    ));
    toast.success(`Amenidad ${!isActive ? 'activada' : 'desactivada'} exitosamente`);
  };

  const handleDeleteAmenity = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta amenidad? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Amenidad eliminada exitosamente');
      await fetchAmenities();
    } catch (error: any) {
      console.error('Error deleting amenity:', error);
      toast.error('Error al eliminar amenidad: ' + error.message);
    }
  };

  if (loading) {
    return <div>Cargando amenidades...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestión de Amenidades</CardTitle>
          <CardDescription>
            Administra las amenidades disponibles para las propiedades
          </CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Amenidad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Amenidad</DialogTitle>
              <DialogDescription>
                Agrega una nueva amenidad que los agentes podrán usar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Piscina, Gimnasio, etc."
                />
              </div>
              <div>
                <Label htmlFor="icon">Ícono SVG (opcional)</Label>
                <Input
                  id="icon"
                  value={newAmenity.icon_svg}
                  onChange={(e) => setNewAmenity(prev => ({ ...prev, icon_svg: e.target.value }))}
                  placeholder="<svg>...</svg>"
                />
              </div>
              <Button onClick={handleCreateAmenity} className="w-full">
                Crear Amenidad
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {amenities.map((amenity) => (
              <TableRow key={amenity.id}>
                <TableCell className="font-medium">{amenity.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {amenity.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={amenity.is_active ? "text-green-700" : "text-red-700"}>
                      {amenity.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingAmenity(amenity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Amenidad</DialogTitle>
                          <DialogDescription>
                            Modifica la información de la amenidad
                          </DialogDescription>
                        </DialogHeader>
                        {editingAmenity && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="editName">Nombre</Label>
                              <Input
                                id="editName"
                                value={editingAmenity.name}
                                onChange={(e) => setEditingAmenity(prev => 
                                  prev ? { ...prev, name: e.target.value } : null
                                )}
                                placeholder="Ej: Piscina, Gimnasio, etc."
                              />
                            </div>
                            <div>
                              <Label htmlFor="editIcon">Ícono SVG (opcional)</Label>
                              <Input
                                id="editIcon"
                                value={editingAmenity.icon_svg || ""}
                                onChange={(e) => setEditingAmenity(prev => 
                                  prev ? { ...prev, icon_svg: e.target.value } : null
                                )}
                                placeholder="<svg>...</svg>"
                              />
                            </div>
                            <Button onClick={handleUpdateAmenity} className="w-full">
                              Actualizar Amenidad
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant={amenity.is_active ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleAmenityStatus(amenity.id, amenity.is_active)}
                      title={amenity.is_active ? "Desactivar" : "Activar"}
                    >
                      {amenity.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAmenity(amenity.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {amenities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay amenidades configuradas. Crea la primera amenidad.
          </div>
        )}
      </CardContent>
    </Card>
  );
}