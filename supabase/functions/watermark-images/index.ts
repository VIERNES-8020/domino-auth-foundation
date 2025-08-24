import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://deno.land/x/canvas@v1.4.1/mod.ts"
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function addWatermark(imageUrl: string): Promise<Uint8Array> {
  try {
    // Load the original image
    const image = await loadImage(imageUrl);
    
    // Create canvas with same dimensions as image
    const canvas = createCanvas(image.width(), image.height());
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(image, 0, 0);
    
    // Set up watermark styling
    const fontSize = Math.max(24, Math.min(image.width(), image.height()) * 0.04);
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; // Semi-transparent white
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'; // Semi-transparent black outline
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position watermark in center
    const centerX = image.width() / 2;
    const centerY = image.height() / 2;
    
    // Add subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw the watermark text with outline
    ctx.strokeText('DOMIN10', centerX, centerY);
    ctx.fillText('DOMIN10', centerX, centerY);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add smaller watermarks in corners for extra protection
    const cornerFontSize = fontSize * 0.6;
    ctx.font = `bold ${cornerFontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    
    // Top-left corner
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.strokeText('DOMIN10', 20, 20);
    ctx.fillText('DOMIN10', 20, 20);
    
    // Bottom-right corner
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.strokeText('DOMIN10', image.width() - 20, image.height() - 20);
    ctx.fillText('DOMIN10', image.width() - 20, image.height() - 20);
    
    // Convert canvas to PNG buffer
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error adding watermark:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log('[WATERMARK] Processing image:', imageUrl);

    // Add watermark to the image
    const watermarkedBuffer = await addWatermark(imageUrl);
    
    // Generate unique filename for watermarked image
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const filename = `watermarked-${timestamp}-${randomId}.png`;
    
    // Upload watermarked image to Supabase storage
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-files')
      .upload(filename, watermarkedBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL of the watermarked image
    const { data: { publicUrl } } = supabase.storage
      .from('property-files')
      .getPublicUrl(filename);

    const response = {
      originalUrl: imageUrl,
      watermarkedUrl: publicUrl,
      processed: true,
      message: 'Watermark applied successfully'
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in watermark function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process watermark',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});