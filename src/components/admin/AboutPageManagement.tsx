import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Image, Upload } from "lucide-react";

interface AboutContent {
  id: string;
  section_key: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
}

export default function AboutPageManagement() {
  const [content, setContent] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_page_content')
        .select('*')
        .order('section_key');
      
      if (error) throw error;
      setContent(data || []);
    } catch (error: any) {
      toast.error('Error loading content: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = (sectionKey: string, field: string, value: string) => {
    setContent(prev => 
      prev.map(item => 
        item.section_key === sectionKey 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      for (const item of content) {
        const { error } = await supabase
          .from('about_page_content')
          .update({
            title: item.title,
            content: item.content,
            image_url: item.image_url
          })
          .eq('section_key', item.section_key);
        
        if (error) throw error;
      }
      
      toast.success('Contenido guardado exitosamente');
    } catch (error: any) {
      toast.error('Error saving content: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ceo-image-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      updateContent('ceo_section', 'image_url', publicUrl);
      toast.success('Imagen subida exitosamente');
    } catch (error: any) {
      toast.error('Error al subir la imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const sectionNames = {
    ceo_section: "Sección CEO y Manifiesto",
    mission: "Misión",
    vision: "Visión", 
    values: "Valores",
    objectives: "Objetivos"
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando contenido...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gestión de Página "Sobre Nosotros"
            <Button onClick={saveContent} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </CardTitle>
          <CardDescription>
            Edita el contenido que aparece en la página "Sobre Nosotros"
          </CardDescription>
        </CardHeader>
      </Card>

      {content.map((item) => (
        <Card key={item.section_key}>
          <CardHeader>
            <CardTitle className="text-lg">
              {sectionNames[item.section_key as keyof typeof sectionNames] || item.section_key}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={item.title || ""}
                onChange={(e) => updateContent(item.section_key, 'title', e.target.value)}
                placeholder="Título de la sección"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Contenido</label>
              <Textarea
                value={item.content || ""}
                onChange={(e) => updateContent(item.section_key, 'content', e.target.value)}
                placeholder="Contenido de la sección"
                rows={4}
              />
            </div>
            
            {item.section_key === 'ceo_section' && (
              <div>
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Image className="h-4 w-4" />
                  Imagen del CEO
                </label>
                
                {/* Mostrar imagen actual si existe */}
                {item.image_url && (
                  <div className="mb-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-2 rounded-full bg-primary/10">
                      <img 
                        src={item.image_url} 
                        alt="CEO" 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = target.nextElementSibling as HTMLElement;
                          target.style.display = 'none';
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-primary font-bold text-2xl">
                        D
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Liderazgo</div>
                      <div className="text-xs text-muted-foreground">DOMINIO Inmobiliaria</div>
                    </div>
                  </div>
                )}

                {/* Área de carga de archivos o mensaje de éxito */}
                {uploading ? (
                  <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
                    <div className="flex items-center gap-3 mb-4">
                      <Upload className="h-5 w-5 text-primary animate-pulse" />
                      <span className="text-sm font-medium text-primary">Subiendo imagen...</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Imagen CEO</span>
                        <span>Procesando...</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: "60%"}}></div>
                      </div>
                    </div>
                  </div>
                ) : item.image_url ? (
                  <div className="border-2 border-green-500/25 rounded-lg p-6 bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">¡Imagen subida con éxito!</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                        <span>Imagen CEO</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: "100%"}}></div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        Cambiar imagen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Selecciona un archivo de imagen (PNG, JPG, máx. 2MB)
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Seleccionar archivo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      O pega la URL de una imagen
                    </p>
                    <Input
                      value={item.image_url || ""}
                      onChange={(e) => updateContent(item.section_key, 'image_url', e.target.value)}
                      placeholder="https://ejemplo.com/logo.png"
                      className="mt-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>
              Para subir imágenes, ve a{" "}
              <a 
                href="https://supabase.com/dashboard/project/rzsailqcijraplggryyy/storage/buckets" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Supabase Storage
              </a>
              {" "}y copia la URL pública
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}