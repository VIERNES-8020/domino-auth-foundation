import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

    try {
      for (const file of files) {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        setUploadedFiles(prev => [...prev, { name: file.name, url: publicUrl }]);
      }

      // Apply watermark to images if available
      if (accept.includes('image')) {
        try {
          const watermarkedUrls = await Promise.all(
            uploadedUrls.map(async (url) => {
              try {
                const { data, error } = await supabase.functions.invoke('watermark-images', {
                  body: { imageUrl: url }
                });
                
                if (error) throw error;
                return data?.watermarkedUrl || url;
              } catch (error) {
                console.log('Watermark failed, using original:', error);
                return url; // Fallback to original
              }
            })
          );
          onFilesUploaded(watermarkedUrls);
        } catch (error) {
          console.error('Watermark processing failed:', error);
          onFilesUploaded(uploadedUrls); // Use original URLs if watermark fails
        }
      } else {
        onFilesUploaded(uploadedUrls);
      }

      toast.success(`${files.length} archivo(s) subido(s) exitosamente`);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error('Error al subir archivos: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (urlToRemove: string) => {
    setUploadedFiles(prev => prev.filter(file => file.url !== urlToRemove));
    // Update parent component
    const remainingUrls = uploadedFiles
      .filter(file => file.url !== urlToRemove)
      .map(file => file.url);
    onFilesUploaded(remainingUrls);
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
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                {accept.includes('image') && (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
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