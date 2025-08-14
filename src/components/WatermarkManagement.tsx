import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Image, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function WatermarkManagement() {
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string>("");

  useEffect(() => {
    // Load current watermark logo from storage or database
    loadCurrentLogo();
  }, []);

  const loadCurrentLogo = async () => {
    try {
      // TODO: Implement loading current logo from storage
      // For now, using a placeholder
      setCurrentLogo("");
    } catch (error) {
      console.error("Error loading current logo:", error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo no puede ser mayor a 2MB");
      return;
    }

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `watermark-logo.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('watermarks')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('watermarks')
        .getPublicUrl(fileName);

      setCurrentLogo(publicUrl);
      setLogoUrl(publicUrl);
      toast.success("Logo de marca de agua actualizado");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Error al subir el logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // TODO: Remove logo from storage
      setCurrentLogo("");
      setLogoUrl("");
      toast.success("Logo de marca de agua eliminado");
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast.error("Error al eliminar el logo");
    }
  };

  const testWatermark = async () => {
    if (!currentLogo) {
      toast.error("Primero sube un logo de marca de agua");
      return;
    }

    try {
      // Test the watermark function with a sample image
      const sampleImageUrl = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6";
      
      const { data, error } = await supabase.functions.invoke('watermark-images', {
        body: {
          imageUrl: sampleImageUrl,
          logoUrl: currentLogo
        }
      });

      if (error) throw error;

      toast.success("Función de marca de agua probada exitosamente");
      console.log("Watermark test result:", data);
    } catch (error: any) {
      console.error("Error testing watermark:", error);
      toast.error("Error probando la marca de agua: " + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Gestión de Marca de Agua
        </CardTitle>
        <CardDescription>
          Configura el logo que se aplicará automáticamente a todas las imágenes de propiedades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Logo Display */}
        {currentLogo && (
          <div className="space-y-2">
            <Label>Logo actual</Label>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <img
                src={currentLogo}
                alt="Logo de marca de agua actual"
                className="h-16 w-16 object-contain bg-gray-100 rounded"
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Este logo se aplicará automáticamente a todas las nuevas imágenes
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-2">
          <Label>Subir nuevo logo</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona un logo en formato PNG con fondo transparente
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="logo-upload"
                disabled={uploading}
              />
              <label htmlFor="logo-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  asChild
                >
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Subiendo..." : "Seleccionar archivo"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Recomendado: PNG con fondo transparente, máximo 2MB
          </p>
        </div>

        {/* Manual URL Input */}
        <div className="space-y-2">
          <Label htmlFor="logoUrl">O ingresa una URL del logo</Label>
          <div className="flex gap-2">
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
            />
            <Button
              onClick={() => setCurrentLogo(logoUrl)}
              disabled={!logoUrl.trim()}
            >
              Usar
            </Button>
          </div>
        </div>

        {/* Test Section */}
        <div className="pt-4 border-t">
          <Button
            onClick={testWatermark}
            disabled={!currentLogo}
            className="w-full"
          >
            Probar Marca de Agua
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Esto probará la función con una imagen de muestra
          </p>
        </div>
      </CardContent>
    </Card>
  );
}