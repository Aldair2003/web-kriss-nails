export type ImageType = 'GALLERY' | 'BEFORE_AFTER' | 'SERVICE' | 'TEMP';

export interface Image {
  id: string;
  url: string;
  thumbnailUrl?: string;
  publicId: string;
  title?: string;
  category?: string;
  type: ImageType;
  isActive: boolean;
  isHighlight?: boolean;
  serviceId?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Propiedades para imágenes de Antes/Después
  isAfterImage?: boolean;      // Indica si es una imagen "después"
  beforeImageId?: string;      // ID de la imagen "antes" relacionada
  hasAfterImage?: boolean;     // Indica si la imagen tiene una imagen "después" asociada
  afterImageUrl?: string;      // URL de la imagen "después" relacionada
  beforeAfterPair?: {         // Objeto con las URLs de antes/después
    before: string;
    after: string;
  };
  displayServiceName?: string; // Nombre del servicio visual (sin relación con servicios reales)
  displayServiceCategory?: string; // Categoría del servicio visual (sin relación con servicios reales)
} 