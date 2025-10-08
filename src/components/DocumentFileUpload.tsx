import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Upload, X, File } from "lucide-react";

interface DocumentFileUploadProps {
  files: string[];
  onFilesChange: (urls: string[]) => void;
  type: 'contract' | 'voucher';
  maxFiles: number;
  maxSizeMB: number;
  bucket: string;
  label: string;
  description: string;
  agentId: string;
}

export default function DocumentFileUpload({
  files,
  onFilesChange,
  type,
  maxFiles,
  maxSizeMB,
  bucket,
  label,
  description,
  agentId
}: DocumentFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const accept = type === 'contract' ? '.pdf' : '.pdf,image/*';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    console.log(`=== SUBIDA ${type.toUpperCase()} INICIADA ===`, {
      filesCount: selectedFiles.length,
      existingFiles: files.length
    });

    // Validar cantidad máxima
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} archivo(s). Ya tienes ${files.length} subido(s).`);
      event.target.value = "";
      return;
    }

    // Validar tamaño y tipo de cada archivo
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validar tamaño
      if (file.size > maxSizeMB * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`"${file.name}" es ${sizeMB}MB. Máximo: ${maxSizeMB}MB.`);
        event.target.value = "";
        return;
      }

      // Validar tipo para contrato (solo PDF)
      if (type === 'contract' && file.type !== 'application/pdf') {
        toast.error('El contrato debe ser un archivo PDF');
        event.target.value = "";
        return;
      }

      // Validar tipo para comprobantes (PDF o imágenes)
      if (type === 'voucher') {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          toast.error(`"${file.name}" no es un formato válido. Use PDF, JPG o PNG.`);
          event.target.value = "";
          return;
        }
      }
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      toast.info(`📤 Subiendo ${selectedFiles.length} archivo(s)...`);
      
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const folderName = type === 'contract' ? 'contracts' : 'vouchers';
        const fileName = `${agentId}/${folderName}/${Date.now()}-${index}.${fileExt}`;
        
        console.log(`Subiendo archivo ${index + 1}:`, file.name);
        
        // Simular progreso
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);
        
        clearInterval(progressInterval);
        
        if (error) {
          console.error(`Error subiendo archivo ${index + 1}:`, error);
          if (error.message.includes('exceeded') || error.message.includes('quota')) {
            throw new Error('Almacenamiento lleno. Contacta al administrador.');
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error('Sin conexión a internet. Revisa tu conexión.');
          } else {
            throw new Error(`Error al subir: ${error.message}`);
          }
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        
        console.log(`Archivo ${index + 1} subido exitosamente:`, publicUrl);
        setUploadProgress(100);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newFiles = [...files, ...uploadedUrls];
      onFilesChange(newFiles);
      
      console.log(`=== TODOS LOS ${type.toUpperCase()} SUBIDOS ===`, { totalFiles: newFiles.length });
      toast.success(`✅ ${selectedFiles.length} archivo(s) subido(s) correctamente`);
      event.target.value = "";
      
    } catch (error: any) {
      console.error(`=== ERROR EN SUBIDA DE ${type.toUpperCase()} ===`, error);
      toast.error(error.message || 'Error al subir archivo');
      event.target.value = "";
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    onFilesChange(newFiles);
    toast.success('🗑️ Archivo eliminado');
  };

  const getFileType = (url: string): 'pdf' | 'image' => {
    return url.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
  };

  return (
    <div className="space-y-4">
      {/* Mostrar archivos subidos */}
      {files && files.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-green-700" />
            <span className="text-sm font-medium text-green-800">
              {files.length} archivo(s) subido(s)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {files.map((url, index) => {
              const fileType = getFileType(url);
              const fileName = url.split('/').pop() || `Archivo ${index + 1}`;
              
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200 group hover:border-green-400 transition-colors">
                  {/* Vista previa */}
                  <div className="flex-shrink-0 w-16 h-16 rounded border border-muted overflow-hidden bg-muted flex items-center justify-center">
                    {fileType === 'image' ? (
                      <img
                        src={url}
                        alt={`Archivo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  
                  {/* Nombre del archivo */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {type === 'contract' ? 'Contrato' : `Comprobante ${index + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fileType === 'pdf' ? 'PDF' : 'Imagen'}
                    </p>
                  </div>
                  
                  {/* Botón eliminar */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Área de subida */}
      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary hover:bg-accent/5 transition-all">
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          disabled={uploading || files.length >= maxFiles}
          className="hidden"
          id={`${type}-upload-input`}
        />
        <label htmlFor={`${type}-upload-input`} className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            {/* Ícono */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              {type === 'contract' ? (
                <FileText className="w-8 h-8 text-primary" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            
            {/* Texto */}
            <div>
              <div className="text-lg font-medium mb-1">{label}</div>
              <div className="text-sm text-muted-foreground">
                {description}
              </div>
            </div>
            
            {/* Barra de progreso */}
            {uploading && uploadProgress > 0 && (
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
              </div>
            )}
            
            {/* Botón */}
            <Button 
              type="button" 
              variant="outline" 
              disabled={uploading || files.length >= maxFiles}
              asChild
            >
              <span className="flex items-center gap-2">
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 animate-pulse" />
                    Subiendo...
                  </>
                ) : files.length >= maxFiles ? (
                  <>
                    <FileText className="w-4 h-4" />
                    Máximo {maxFiles} archivo(s)
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {files.length === 0 ? 'Seleccionar archivo' : 'Agregar más'}
                  </>
                )}
              </span>
            </Button>
          </div>
        </label>
      </div>
      
      {/* Información */}
      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
        <File className="w-4 h-4 inline mr-1" />
        <strong>Información:</strong> Máximo {maxFiles} archivo(s), {maxSizeMB}MB cada uno. 
        {type === 'contract' && ' Solo archivos PDF.'} 
        {type === 'voucher' && ' Formatos: PDF, JPG, PNG.'}
      </div>
    </div>
  );
}
