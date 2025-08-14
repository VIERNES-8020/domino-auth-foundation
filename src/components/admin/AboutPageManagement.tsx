import { useState, useEffect } from "react";
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
                <label className="text-sm font-medium flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  URL de Imagen (CEO)
                </label>
                <Input
                  value={item.image_url || ""}
                  onChange={(e) => updateContent(item.section_key, 'image_url', e.target.value)}
                  placeholder="https://ejemplo.com/foto-ceo.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Sube la imagen a Supabase Storage o usa una URL externa
                </p>
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