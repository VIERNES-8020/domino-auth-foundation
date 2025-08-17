import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Image, X, TestTube } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const supabaseUrl = "https://rzsailqcijraplggryyy.supabase.co";

export default function WatermarkManagement() {
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentLogo();
  }, []);

  const loadCurrentLogo = async () => {
    try {
      // Try to load current watermark logo from storage or database
      // For now, we'll check if there's a logo in storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .list('watermark/', { limit: 1 });
      
      if (data && data.length > 0) {
        const logoFile = data[0];
        const logoPath = `${supabaseUrl}/storage/v1/object/public/property-images/watermark/${logoFile.name}`;
        setCurrentLogo(logoPath);
      }
    } catch (error) {
      console.error('Error loading current logo:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona un archivo de imagen");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo es muy grande. Máximo 2MB");
      return;
    }

    setUploading(true);
    try {
      // Remove existing logo first
      if (currentLogo) {
        await handleRemoveLogo();
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `watermark-logo.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(`watermark/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const newLogoUrl = `${supabaseUrl}/storage/v1/object/public/property-images/watermark/${fileName}`;
      setCurrentLogo(newLogoUrl);
      setLogoUrl("");
      
      toast.success("Logo de marca de agua subido exitosamente");
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error("Error subiendo el logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!logoUrl.trim()) {
      toast.error("Por favor ingresa una URL válida");
      return;
    }

    setUploading(true);
    try {
      // Download image from URL and upload to storage
      const response = await fetch(logoUrl);
      if (!response.ok) throw new Error("No se pudo descargar la imagen");
      
      const blob = await response.blob();
      const file = new File([blob], "watermark-logo.png", { type: blob.type });
      
      // Remove existing logo first
      if (currentLogo) {
        await handleRemoveLogo();
      }
      
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(`watermark/watermark-logo.png`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const newLogoUrl = `${supabaseUrl}/storage/v1/object/public/property-images/watermark/watermark-logo.png`;
      setCurrentLogo(newLogoUrl);
      setLogoUrl("");
      
      toast.success("Logo de marca de agua guardado exitosamente");
    } catch (error: any) {
      console.error('Error uploading logo from URL:', error);
      toast.error("Error guardando el logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // Remove logo from storage
      const { error } = await supabase.storage
        .from('property-images')
        .remove(['watermark/watermark-logo.png', 'watermark/watermark-logo.jpg', 'watermark/watermark-logo.jpeg']);
      
      if (error) console.warn('Error removing logo:', error);
      
      setCurrentLogo(null);
      toast.success("Logo de marca de agua eliminado");
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error("Error eliminando el logo");
    }
  };

  const testWatermark = async () => {
    if (!currentLogo) {
      toast.error("Primero sube un logo de marca de agua");
      return;
    }

    try {
      toast.info("Probando marca de agua...");
      
      const { data, error } = await supabase.functions.invoke('watermark-images', {
        body: {
          imageUrl: "https://via.placeholder.com/800x600/0066cc/ffffff?text=Propiedad+de+Prueba",
          logoUrl: currentLogo
        }
      });

      if (error) throw error;

      if (data?.watermarkedUrl) {
        toast.success("Marca de agua aplicada exitosamente");
        console.log('Watermarked image URL:', data.watermarkedUrl);
      } else {
        toast.info(data?.message || "Test de marca de agua completado");
      }
    } catch (error: any) {
      console.error('Error testing watermark:', error);
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
          <div className="border rounded-lg p-4">
            <Label className="text-sm font-medium">Logo Actual</Label>
            <div className="mt-2 flex items-center gap-4">
              <img 
                src={currentLogo} 
                alt="Logo de marca de agua actual" 
                className="h-16 w-16 object-contain border rounded"
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Este logo se aplicará automáticamente a todas las nuevas imágenes de propiedades
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload New Logo */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Subir Nuevo Logo</Label>
          
          {/* File Upload */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona un archivo de imagen (PNG, JPG, máx. 2MB)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="logo-upload"
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

          {/* URL Upload */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="logo-url">O pega la URL de una imagen</Label>
              <Input
                id="logo-url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                disabled={uploading}
              />
            </div>
            <Button
              onClick={handleUrlUpload}
              disabled={uploading || !logoUrl.trim()}
              className="self-end"
            >
              {uploading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>

        {/* Test Watermark */}
        <div className="pt-4 border-t">
          <Button
            onClick={testWatermark}
            variant="outline"
            className="w-full"
            disabled={!currentLogo}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Probar Marca de Agua
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Prueba la funcionalidad de marca de agua con una imagen de ejemplo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}