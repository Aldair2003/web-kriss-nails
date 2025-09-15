import { authenticatedFetch } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://web-kriss-nails-production.up.railway.app' : 'http://localhost:3001');

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  duration?: number;
  isActive?: boolean;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Obtiene todos los servicios
 */
export async function getServices(): Promise<Service[]> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/services`);

    if (!response.ok) {
      console.error('Error en la respuesta del API de servicios:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Verificar si la respuesta tiene la estructura esperada (objeto con propiedad 'services')
    if (data && typeof data === 'object' && Array.isArray(data.services)) {
      return data.services;
    }
    
    // Verificar si la respuesta es un array directamente
    if (Array.isArray(data)) {
      return data;
    }
    
    // Si llegamos aquí, la respuesta no tiene el formato esperado
    console.error('La respuesta del API no tiene el formato esperado:', data);
    return [];
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return [];
  }
}

/**
 * Obtiene servicios activos para el dropdown de reseñas
 */
export async function getActiveServices(): Promise<Service[]> {
  try {
    const allServices = await getServices();
    // Filtrar solo servicios activos
    return allServices.filter(service => service.isActive !== false);
  } catch (error) {
    console.error('Error al obtener servicios activos:', error);
    return [];
  }
}

/**
 * Obtiene servicios públicos (sin autenticación) para el landing page
 */
export async function getPublicServices(): Promise<Service[]> {
  try {
    console.log('🌐 getPublicServices: URL de API:', `${API_BASE_URL}/api/services`);
    
    // Configurar timeout para evitar que se cuelgue en móviles
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    const response = await fetch(`${API_BASE_URL}/api/services`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('📡 getPublicServices: Respuesta recibida, status:', response.status);

    if (!response.ok) {
      console.error('❌ getPublicServices: Error en la respuesta del API de servicios públicos:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('📋 getPublicServices: Datos recibidos:', data);
    
    // Verificar si la respuesta tiene la estructura esperada (objeto con propiedad 'services')
    if (data && typeof data === 'object' && Array.isArray(data.services)) {
      const filteredServices = data.services.filter((service: Service) => service.isActive !== false);
      console.log('✅ getPublicServices: Servicios activos encontrados:', filteredServices.length);
      return filteredServices;
    }
    
    // Verificar si la respuesta es un array directamente
    if (Array.isArray(data)) {
      const filteredServices = data.filter((service: Service) => service.isActive !== false);
      console.log('✅ getPublicServices: Servicios activos encontrados (array directo):', filteredServices.length);
      return filteredServices;
    }
    
    // Si llegamos aquí, la respuesta no tiene el formato esperado
    console.error('❌ getPublicServices: La respuesta del API público no tiene el formato esperado:', data);
    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ getPublicServices: Timeout al obtener servicios públicos');
    } else {
      console.error('❌ getPublicServices: Error al obtener servicios públicos:', error);
    }
    return [];
  }
}

/**
 * Servicios de fallback para cuando la API no está disponible
 */
const FALLBACK_SERVICES: Service[] = [
  {
    id: 'fallback-1',
    name: 'Manicure Básica',
    description: 'Manicure tradicional con limpieza, corte y esmaltado',
    price: 25,
    duration: 60,
    isActive: true,
    category: 'Manicure'
  },
  {
    id: 'fallback-2',
    name: 'Pedicure Spa',
    description: 'Pedicure completo con exfoliación y masaje',
    price: 35,
    duration: 90,
    isActive: true,
    category: 'Pedicure'
  },
  {
    id: 'fallback-3',
    name: 'Uñas Acrílicas',
    description: 'Aplicación de uñas acrílicas con diseño',
    price: 45,
    duration: 120,
    isActive: true,
    category: 'Uñas'
  }
];

/**
 * Obtiene servicios activos para el dropdown de reseñas (versión pública)
 */
export async function getPublicActiveServices(): Promise<Service[]> {
  try {
    console.log('🔄 getPublicActiveServices: Iniciando...');
    const allServices = await getPublicServices();
    console.log('📋 getPublicActiveServices: Servicios obtenidos:', allServices.length);
    
    // Filtrar solo servicios activos
    const activeServices = allServices.filter(service => service.isActive !== false);
    console.log('✅ getPublicActiveServices: Servicios activos finales:', activeServices.length);
    
    // Si no hay servicios, usar fallback
    if (activeServices.length === 0) {
      console.log('⚠️ getPublicActiveServices: No hay servicios activos, usando servicios de fallback');
      return FALLBACK_SERVICES;
    }
    
    return activeServices;
  } catch (error) {
    console.error('❌ getPublicActiveServices: Error al obtener servicios activos públicos:', error);
    console.log('🔄 getPublicActiveServices: Usando servicios de fallback debido al error');
    return FALLBACK_SERVICES;
  }
}

/**
 * Obtiene un servicio por ID
 */
export async function getServiceById(id: string): Promise<Service> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/services/${id}`);

  if (!response.ok) {
    throw new Error('Error al obtener servicio');
  }

  return response.json();
} 