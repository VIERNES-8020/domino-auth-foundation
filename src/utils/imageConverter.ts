/**
 * Converts any image format to JPG and resizes it to fit within max dimensions
 */
export const convertImageToJPG = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Fill with white background (important for JPG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Draw and resize image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a new File object with JPG extension
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const jpgFile = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(jpgFile);
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL from file
    img.src = URL.createObjectURL(file);
  });
};