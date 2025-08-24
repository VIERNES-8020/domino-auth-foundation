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
    // Always show watermark indicator for all images
    setHasWatermark(true);
    
    // Check if image already has watermark
    if (src.includes('watermarked-') || src.includes('default-placeholder')) {
      setImageSrc(src);
      return;
    }

    // Apply watermark to ALL images (internal and external)
    const applyWatermark = async () => {
      if (isProcessing) return;
      
      setIsProcessing(true);
      try {
        console.log('Applying watermark to:', src);
        const { data, error } = await supabase.functions.invoke('watermark-images', {
          body: { imageUrl: src }
        });
        
        if (error) {
          console.error('Watermark error:', error);
          throw error;
        }
        
        console.log('Watermark response:', data);
        
        if (data?.watermarkedUrl && data.watermarkedUrl !== src) {
          setImageSrc(data.watermarkedUrl);
          console.log('Watermark applied successfully:', data.watermarkedUrl);
        } else {
          setImageSrc(src);
          console.log('Using original image');
        }
      } catch (error) {
        console.error('Watermark failed:', error);
        setImageSrc(src);
      } finally {
        setIsProcessing(false);
      }
    };

    applyWatermark();
  }, [src]);

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
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md text-sm font-medium text-gray-800">
            Procesando marca de agua...
          </div>
        </div>
      )}
      {/* DOMIN10.COM watermark overlay - ALWAYS visible */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="text-white/60 text-2xl font-bold tracking-wider transform rotate-0 drop-shadow-lg">
          DOMIN10.COM
        </div>
      </div>
      {/* Corner watermark indicators */}
      <div className="absolute top-2 left-2 text-white/40 text-xs font-medium tracking-wide drop-shadow-md pointer-events-none z-20">
        DOMIN10.COM
      </div>
      <div className="absolute bottom-2 right-2 text-white/40 text-xs font-medium tracking-wide drop-shadow-md pointer-events-none z-20">
        DOMIN10.COM
      </div>
    </div>
  );
}