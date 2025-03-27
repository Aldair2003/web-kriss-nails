export interface ServiceFormData {
  id?: string
  name: string
  description: string
  price: number
  duration: string
  categoryId: string
  isActive: boolean
  isHighlight: boolean
  hasOffer: boolean
  offerPrice?: number
  images: Array<{ id: string; url: string }>
} 