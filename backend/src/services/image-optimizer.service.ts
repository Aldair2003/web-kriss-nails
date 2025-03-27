import sharp from 'sharp';
import { Readable } from 'stream';

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export class ImageOptimizerService {
  private readonly DEFAULT_OPTIONS: OptimizationOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 80,
    format: 'webp'
  };

  /**
   * Optimiza una imagen con las opciones especificadas
   */
  async optimizeImage(
    buffer: Buffer,
    options: OptimizationOptions = {}
  ): Promise<Buffer> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('No se pudo obtener las dimensiones de la imagen');
      }

      // Calcular las nuevas dimensiones manteniendo el aspect ratio
      const aspectRatio = metadata.width / metadata.height;
      let newWidth = metadata.width;
      let newHeight = metadata.height;

      if (newWidth > finalOptions.maxWidth!) {
        newWidth = finalOptions.maxWidth!;
        newHeight = Math.round(newWidth / aspectRatio);
      }

      if (newHeight > finalOptions.maxHeight!) {
        newHeight = finalOptions.maxHeight!;
        newWidth = Math.round(newHeight * aspectRatio);
      }

      // Aplicar las optimizaciones
      let optimizedImage = image
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });

      // Convertir al formato deseado
      switch (finalOptions.format) {
        case 'jpeg':
          optimizedImage = optimizedImage.jpeg({ quality: finalOptions.quality });
          break;
        case 'webp':
          optimizedImage = optimizedImage.webp({ quality: finalOptions.quality });
          break;
        case 'png':
          optimizedImage = optimizedImage.png({ quality: finalOptions.quality });
          break;
      }

      return await optimizedImage.toBuffer();
    } catch (error) {
      console.error('Error al optimizar la imagen:', error);
      throw new Error('Error al procesar la imagen');
    }
  }

  /**
   * Valida una imagen antes de procesarla
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      // Validar formato
      const validFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!metadata.format || !validFormats.includes(metadata.format)) {
        throw new Error('Formato de imagen no soportado');
      }

      // Validar dimensiones mínimas
      if (!metadata.width || !metadata.height) {
        throw new Error('No se pudo obtener las dimensiones de la imagen');
      }

      if (metadata.width < 200 || metadata.height < 200) {
        throw new Error('La imagen es demasiado pequeña (mínimo 200x200)');
      }

      // Validar proporción
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        throw new Error('La proporción de la imagen no es válida (máximo 3:1 o 1:3)');
      }

      return true;
    } catch (error) {
      console.error('Error al validar la imagen:', error);
      throw error;
    }
  }

  /**
   * Convierte un Buffer a un Stream legible
   */
  bufferToStream(buffer: Buffer): Readable {
    return Readable.from(buffer);
  }
} 