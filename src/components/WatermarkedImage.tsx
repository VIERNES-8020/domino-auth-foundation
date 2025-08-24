import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  loading?: "lazy" | "eager";
  [key: string]: any;
}

export default function WatermarkedImage({ 
  src, 
  alt, 
  className = "", 
  onError,
  loading = "lazy",
  ...props 
}: WatermarkedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasWatermark, setHasWatermark] = useState(false);

  useEffect(() => {
    // Check if image already has watermark or is external
    if (src.includes('watermarked-') || 
        src.includes('default-placeholder') ||
        !src.includes(window.location.origin)) {
      setImageSrc(src);
      setHasWatermark(true);
      return;
    }

    // Apply watermark to new images
    const applyWatermark = async () => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('watermark-images', {
          body: { imageUrl: src }
        });
        
        if (error) throw error;
        
        if (data?.watermarkedUrl && data.watermarkedUrl !== src) {
          setImageSrc(data.watermarkedUrl);
          setHasWatermark(true);
        } else {
          setImageSrc(src);
        }
      } catch (error) {
        console.log('Watermark failed, using original:', error);
        setImageSrc(src);
      } finally {
        setIsProcessing(false);
      }
    };

    applyWatermark();
  }, [src, isProcessing]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // If watermarked image fails, fallback to original
    if (imageSrc !== src && !imageSrc.includes('default-placeholder')) {
      setImageSrc(src);
    } else if (onError) {
      onError(e);
    } else {
      // Final fallback to placeholder
      const target = e.currentTarget as HTMLImageElement;
      if (target.src !== window.location.origin + "/default-placeholder.jpg") {
        target.src = "/default-placeholder.jpg";
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      <img
        src={imageSrc}
        alt={alt}
        className={`property-image loading-image ${hasWatermark ? 'loaded' : ''} ${className}`}
        loading={loading}
        onError={handleError}
        {...props}
      />
      {isProcessing && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-medium text-gray-800">
            Procesando...
          </div>
        </div>
      )}
      {/* Subtle DOMIN10 indicator for already watermarked images */}
      {hasWatermark && !isProcessing && (
        <div className="watermark-indicator">
          DOMIN10
        </div>
      )}
    </div>
  );
}