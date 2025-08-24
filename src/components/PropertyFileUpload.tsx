import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadItem {
  url: string;
  name: string;
}

interface PropertyFileUploadProps {
  files: string[];
  onFilesChange: (urls: string[]) => void;
  type: 'image' | 'plan';
  maxFiles: number;
  maxSizeMB: number;
  accept: string;
  bucket: string;
  label: string;
  description: string;
}

export default function PropertyFileUpload({
  files,
  onFilesChange,
  type,
  maxFiles,
  maxSizeMB,
  accept,
  bucket,
  label,
  description
}: PropertyFileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    console.log(`=== SUBIDA ${type.toUpperCase()} INICIADA ===`, {
      filesCount: selectedFiles.length,
      existingFiles: files.length
    });

    // Validar cantidad máxima
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`❌ MÁXIMO ${maxFiles} ARCHIVOS: Ya tienes ${files.length}, intentas subir ${selectedFiles.length}. Total sería ${files.length + selectedFiles.length}.`);
      event.target.value = "";
      return;
    }

    // Validar tamaño de cada archivo
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.size > maxSizeMB * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`❌ ARCHIVO MUY GRANDE: "${file.name}" es ${sizeMB}MB. Máximo: ${maxSizeMB}MB. Comprime el archivo o usa uno más pequeño.`);
        event.target.value = "";
        return;
      }
    }

    setUploading(true);
    
    try {
      toast.info(`📤 Subiendo ${selectedFiles.length} archivo(s)...`);
      
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}-${Date.now()}-${index}.${fileExt}`;
        
        console.log(`Subiendo archivo ${index + 1}:`, file.name);
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);
        
        if (error) {
          console.error(`Error subiendo archivo ${index + 1}:`, error);
          // Manejar diferentes tipos de errores con mensajes específicos
          if (error.message.includes('exceeded') || error.message.includes('quota')) {
            throw new Error(`❌ CUOTA EXCEDIDA: El almacenamiento está lleno. Contacta al administrador.`);
          } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            throw new Error(`❌ SIN INTERNET: Revisa tu conexión a internet y vuelve a intentar.`);
          } else if (error.message.includes('size') || error.message.includes('too large')) {
            throw new Error(`❌ ARCHIVO GRANDE: "${file.name}" es demasiado pesado para el servidor.`);
          } else if (error.message.includes('timeout')) {
            throw new Error(`❌ TIEMPO AGOTADO: Conexión lenta. Intenta con archivos más pequeños.`);
          } else {
            throw new Error(`❌ ERROR DE SERVIDOR: ${error.message}`);
          }
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        
        console.log(`Archivo ${index + 1} subido exitosamente:`, publicUrl);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newFiles = [...files, ...uploadedUrls];
      onFilesChange(newFiles);
      
      console.log(`=== TODOS LOS ${type.toUpperCase()} SUBIDOS ===`, { totalFiles: newFiles.length });
      toast.success(`✅ ${selectedFiles.length} ARCHIVO(S) SUBIDOS: Todos los archivos están disponibles`);
      event.target.value = "";
      
    } catch (error: any) {
      console.error(`=== ERROR EN SUBIDA DE ${type.toUpperCase()} ===`, error);
      toast.error(error.message || `❌ Error desconocido subiendo ${type}`);
      event.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    onFilesChange(newFiles);
    toast.success(`🗑️ Archivo ${indexToRemove + 1} eliminado`);
  };

  return (
    <div className="space-y-4">
      {/* Mostrar archivos subidos */}
      {files && files.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">
              {type === 'image' ? '📸' : '📋'}
            </span>
            <span className="text-sm font-medium text-green-800">
              {files.length} {type === 'image' ? 'imagen(es)' : 'plano(s)'} subido(s)
            </span>
          </div>
          <div className={type === 'image' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            : "grid grid-cols-1 md:grid-cols-2 gap-3"
          }>
            {files.map((url, index) => (
              <div key={index} className={type === 'image' ? "relative group" : "flex items-center justify-between p-2 bg-white rounded border"}>
                {type === 'image' ? (
                  <>
                    <img
                      src={url}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700">Plano {index + 1}</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      🗑️ Eliminar
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Botón de subida */}
      <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary hover:bg-accent/5 transition-all">
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          disabled={uploading || files.length >= maxFiles}
          className="hidden"
          id={`${type}-upload`}
        />
        <label htmlFor={`${type}-upload`} className="cursor-pointer">
          <div className="text-4xl mb-2">
            {type === 'image' ? '📸' : '📋'}
          </div>
          <div className="text-lg font-medium mb-1">{label}</div>
          <div className="text-sm text-muted-foreground mb-2">
            {description}
          </div>
          <Button 
            type="button" 
            variant="outline" 
            disabled={uploading || files.length >= maxFiles}
            asChild
          >
            <span>
              {uploading 
                ? "📤 Subiendo..." 
                : files.length >= maxFiles
                ? `✅ Máximo ${maxFiles} archivos`
                : `${type === 'image' ? '📸' : '📤'} ${files.length === 0 ? 'Seleccionar' : 'Agregar más'} ${type === 'image' ? 'Imágenes' : 'Archivos'}`
              }
            </span>
          </Button>
        </label>
      </div>
      
      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
        📄 <strong>Información:</strong> Máximo {maxFiles} archivo(s), {maxSizeMB}MB cada uno. 
        {type === 'image' && ' Formatos: JPG, PNG, WEBP'} 
        {type === 'plan' && ' Formatos: PDF, JPG, PNG'}
      </div>
    </div>
  );
}