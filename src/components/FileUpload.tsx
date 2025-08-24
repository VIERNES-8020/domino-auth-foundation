import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import WatermarkedImage from "@/components/WatermarkedImage";

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  label?: string;
  bucket?: string;
}

export default function FileUpload({
  onFilesUploaded,
  accept = "image/*",
  multiple = true,
  maxFiles = 10,
  maxSize = 5,
  label = "Subir archivos",
  bucket = "property-files"
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    console.log("=== UPLOAD INICIADO ===");
    console.log("Archivos seleccionados:", files.length);
    console.log("Bucket:", bucket);
    
    if (files.length === 0) return;

    // Validate file count
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Algunos archivos exceden el tamaño máximo de ${maxSize}MB`);
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    const newUploadedFiles: { name: string; url: string }[] = [];

    try {
      console.log("Iniciando subida de", files.length, "archivos...");
      
      for (const file of files) {
        console.log("Subiendo archivo:", file.name);
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        console.log("Subiendo a path:", filePath, "en bucket:", bucket);

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (error) {
          console.error("Error al subir archivo:", error);
          throw error;
        }

        console.log("Archivo subido exitosamente:", data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        console.log("URL pública obtenida:", publicUrl);

        uploadedUrls.push(publicUrl);
        newUploadedFiles.push({ name: file.name, url: publicUrl });
      }

      console.log("=== TODOS LOS ARCHIVOS SUBIDOS ===");
      console.log("URLs subidas:", uploadedUrls);

      // Update local state
      const allFiles = [...uploadedFiles, ...newUploadedFiles];
      setUploadedFiles(allFiles);
      
      // Get ALL uploaded URLs to send to parent
      const allUrls = allFiles.map(file => file.url);
      console.log("Notificando parent con todas las URLs:", allUrls);
      
      // Notify parent component with ALL uploaded URLs
      onFilesUploaded(allUrls);
      
      toast.success(`✅ ${files.length} archivo(s) subido(s) exitosamente`);
      
      // Watermark function disabled due to technical issues - using original images
      console.log('Using original images without watermark');
      
    } catch (error: any) {
      console.error('=== ERROR EN UPLOAD ===', error);
      toast.error('Error al subir archivos: ' + error.message);
    } finally {
      console.log("FINALIZANDO UPLOAD");
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (urlToRemove: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.url !== urlToRemove);
    setUploadedFiles(updatedFiles);
    // Update parent component with remaining URLs
    const remainingUrls = updatedFiles.map(file => file.url);
    onFilesUploaded(remainingUrls);
    toast.success("Archivo removido");
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
        <div className="text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            {accept.includes('image') 
              ? "Arrastra imágenes aquí o haz clic para seleccionar"
              : accept.includes('pdf')
              ? "Arrastra archivos PDF aquí o haz clic para seleccionar"
              : "Arrastra archivos aquí o haz clic para seleccionar"
            }
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading || uploadedFiles.length >= maxFiles}
              asChild
            >
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo..." : label}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Archivos subidos:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-card shadow-sm">
                {accept.includes('image') && (
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Máximo {maxFiles} archivos, {maxSize}MB cada uno
      </p>
    </div>
  );
}