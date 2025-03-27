export interface Category {
  id: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: string;
  url: string;
  type: string;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number | string;
  offerPrice?: number | string;
  duration: string;
  categoryId: string;
  isActive: boolean;
  isHighlight: boolean;
  hasOffer: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  images: Image[];
} 