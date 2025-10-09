import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
}

interface RolePermissionsManagerProps {
  userId: string;
  selectedRoleId: string;
  selectedPermissions: string[];
  onRoleChange: (roleId: string) => void;
  onPermissionsChange: (permissions: string[]) => void;
  onClose: () => void;
}

export function RolePermissionsManager({
  userId,
  selectedRoleId,
  selectedPermissions,
  onRoleChange,
  onPermissionsChange,
  onClose
}: RolePermissionsManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Cargar roles y permisos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('nombre');

        if (rolesError) throw rolesError;
        setRoles(rolesData || []);

        // Cargar permisos
        const { data: permisosData, error: permisosError } = await supabase
          .from('permisos')
          .select('*')
          .order('nombre');

        if (permisosError) throw permisosError;
        setPermisos(permisosData || []);

      } catch (error: any) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar roles y permisos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Cargar permisos cuando cambia el rol seleccionado
  useEffect(() => {
    const loadRolePermissions = async () => {
      if (!selectedRoleId) {
        onPermissionsChange([]);
        return;
      }

      setLoadingPermissions(true);
      try {
        const { data, error } = await supabase
          .from('rol_permisos')
          .select('permiso_id')
          .eq('rol_id', selectedRoleId);

        if (error) throw error;
        
        const permisoIds = data?.map(rp => rp.permiso_id) || [];
        onPermissionsChange(permisoIds);
      } catch (error: any) {
        console.error('Error cargando permisos del rol:', error);
        toast.error('Error al cargar permisos del rol');
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadRolePermissions();
  }, [selectedRoleId]);

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast.error('Debes seleccionar un rol');
      return;
    }

    setSaving(true);
    try {
      // 1. Actualizar rol_id en profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ rol_id: selectedRoleId })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 2. Eliminar permisos anteriores del rol
      const { error: deleteError } = await supabase
        .from('rol_permisos')
        .delete()
        .eq('rol_id', selectedRoleId);

      if (deleteError) throw deleteError;

      // 3. Insertar nuevos permisos
      if (selectedPermissions.length > 0) {
        const permissionsToInsert = selectedPermissions.map(permisoId => ({
          rol_id: selectedRoleId,
          permiso_id: permisoId
        }));

        const { error: insertError } = await supabase
          .from('rol_permisos')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Rol y permisos actualizados correctamente');
      onClose();
    } catch (error: any) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar cambios: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permisoId: string) => {
    if (selectedPermissions.includes(permisoId)) {
      onPermissionsChange(selectedPermissions.filter(id => id !== permisoId));
    } else {
      onPermissionsChange([...selectedPermissions, permisoId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Rol */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Seleccionar Rol
        </Label>
        <Select 
          value={selectedRoleId} 
          onValueChange={onRoleChange}
          disabled={saving || loadingPermissions}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona un rol..." />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{role.nombre}</span>
                  {role.descripcion && (
                    <span className="text-xs text-muted-foreground">{role.descripcion}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Información del rol seleccionado */}
      {selectedRoleId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Los permisos mostrados corresponden al rol seleccionado. Puedes modificarlos antes de guardar.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Permisos */}
      {selectedRoleId && (
        <div className="space-y-3">
          <Label className="text-base font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Permisos del Rol
          </Label>
          
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto border rounded-lg p-4 bg-muted/20">
              {permisos.map((permiso) => (
                <div
                  key={permiso.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-background border hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    id={permiso.id}
                    checked={selectedPermissions.includes(permiso.id)}
                    onCheckedChange={() => togglePermission(permiso.id)}
                    disabled={saving}
                  />
                  <div className="flex-1 cursor-pointer" onClick={() => togglePermission(permiso.id)}>
                    <Label
                      htmlFor={permiso.id}
                      className="font-medium text-sm cursor-pointer"
                    >
                      {permiso.nombre.replace(/_/g, ' ').toUpperCase()}
                    </Label>
                    {permiso.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {permiso.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedRoleId || loadingPermissions}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </div>
    </div>
  );
}
