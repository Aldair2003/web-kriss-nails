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

export interface ServiceFormData {
  name: string
  description: string
  price: number
  duration: string
  categoryId: string
  isActive: boolean
  isHighlight: boolean
  hasOffer: boolean
  offerPrice?: number
  images: Array<{
    id: string
    url: string
  }>
}

export interface ServiceFormState {
  name: string
  description: string
  price: string
  hours: number
  minutes: number
  categoryId: string
  isActive: boolean
  isHighlight: boolean
  hasOffer: boolean
  offerPrice?: string
  images: Array<{
    id: string
    url: string
  }>
} 