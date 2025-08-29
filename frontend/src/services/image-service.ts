import { Image } from '@/app/rachell-admin/(dashboard)/galeria/types';
import { API_URL } from '@/config';
import { authenticatedFetch } from '@/lib/auth';

/**
 * Obtiene todas las imágenes
 */
export async function getImages(filters?: {
  type?: string;
  category?: string;
  isActive?: boolean;
  serviceId?: string;
}): Promise<Image[]> {
  // Construir los parámetros de query
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters?.serviceId) params.append('serviceId', filters.serviceId);

  const queryString = params.toString();
  const url = `${API_URL}/api/images${queryString ? `?${queryString}` : ''}`;
  
  console.log('Fetching images with URL:', url);
  
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    throw new Error('Error al obtener imágenes');
  }

  return response.json();
}

/**
 * Obtiene una imagen por ID
 */
export async function getImageById(id: string): Promise<Image> {
  const response = await authenticatedFetch(`${API_URL}/api/images/${id}`);

  if (!response.ok) {
    throw new Error('Error al obtener imagen');
  }

  return response.json();
}

/**
 * Agrega una nueva imagen
 */
export async function addImage(formData: FormData): Promise<Image> {
  console.log("Iniciando proceso de carga de imagen");
  // Comprobar si hay una imagen de "después" y procesarla por separado
  const afterFile = formData.get('afterFile') as File | null;
  const imageType = formData.get('type') as string;
  
  console.log("Tipo de imagen:", imageType);
  console.log("¿Hay imagen después?:", afterFile ? 'Sí' : 'No');
  
  // Para el caso de imágenes antes/después
  if (imageType === 'BEFORE_AFTER' && afterFile && afterFile.size > 0) {
    console.log("Procesando par de imágenes antes/después");
    try {
      // Primero enviamos la imagen "antes"
      const beforeFormData = new FormData();
      beforeFormData.append('image', formData.get('image') as File);
      beforeFormData.append('type', 'BEFORE_AFTER');
      
      if (formData.get('category')) beforeFormData.append('category', formData.get('category') as string);
      if (formData.get('title')) beforeFormData.append('title', formData.get('title') as string);
      if (formData.get('description')) beforeFormData.append('description', formData.get('description') as string);
      if (formData.get('order')) beforeFormData.append('order', formData.get('order') as string);
      
      // Agregar información sobre el par antes/después
      const beforeAfterPair = JSON.stringify({
        before: '', // Se actualizará después
        after: ''   // Se actualizará después
      });
      beforeFormData.append('beforeAfterPair', beforeAfterPair);

      console.log("Enviando imagen ANTES al servidor");
      // Subir la imagen "antes"
      const beforeResponse = await authenticatedFetch(`${API_URL}/api/images`, {
        method: 'POST',
        body: beforeFormData,
      });

      if (!beforeResponse.ok) {
        const error = await beforeResponse.json();
        console.error("Error al subir imagen ANTES:", error);
        throw new Error(error.message || 'Error al añadir imagen "antes"');
      }

      const beforeData = await beforeResponse.json();
      console.log("Respuesta de imagen ANTES:", beforeData);
      const beforeUrl = beforeData.url;
      const imageId = beforeData.id;

      // Ahora enviamos la imagen "después"
      const afterFormData = new FormData();
      afterFormData.append('image', afterFile);
      afterFormData.append('type', 'BEFORE_AFTER');
      // Marcar como imagen "después"
      afterFormData.append('isAfterImage', 'true');
      // Agregar referencia a la imagen "antes"
      afterFormData.append('beforeImageId', imageId);
      
      if (formData.get('category')) afterFormData.append('category', formData.get('category') as string);
      if (formData.get('title')) {
        const title = formData.get('title') as string;
        afterFormData.append('title', `${title} (Después)`);
      }
      
      console.log("Enviando imagen DESPUÉS al servidor con beforeImageId:", imageId);
      // Subir la imagen "después"
      const afterResponse = await authenticatedFetch(`${API_URL}/api/images`, {
        method: 'POST',
        body: afterFormData,
      });

      if (!afterResponse.ok) {
        const error = await afterResponse.json();
        console.error("Error al subir imagen DESPUÉS:", error);
        throw new Error(error.message || 'Error al añadir imagen "después"');
      }

      const afterData = await afterResponse.json();
      console.log("Respuesta de imagen DESPUÉS:", afterData);
      const afterUrl = afterData.url;

      // Actualizar la imagen "antes" con la información completa del par
      const updateData = {
        beforeAfterPair: {
          before: beforeUrl,
          after: afterUrl
        },
        hasAfterImage: true
      };

      console.log("Actualizando imagen ANTES con datos del par:", updateData);
      const updateResponse = await authenticatedFetch(`${API_URL}/api/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        console.error("Error al actualizar par antes/después:", error);
        throw new Error(error.message || 'Error al actualizar par antes/después');
      }

      const finalData = await updateResponse.json();
      console.log("Datos finales de la imagen actualizada:", finalData);
      return finalData;
    } catch (error) {
      console.error('Error en el proceso de subida de antes/después:', error);
      throw error;
    }
  }
  
  // Proceso regular para otros tipos de imágenes
  console.log("Procesando imagen regular (no es par antes/después)");
  
  // Si existe afterFile pero no estamos en modo BEFORE_AFTER, lo eliminamos
  if (afterFile && afterFile.size > 0 && imageType !== 'BEFORE_AFTER') {
    console.log("Eliminando afterFile porque no es una imagen antes/después");
    formData.delete('afterFile');
  }
  
  const response = await authenticatedFetch(`${API_URL}/api/images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error al subir imagen regular:", error);
    throw new Error(error.message || 'Error al añadir imagen');
  }

  const data = await response.json();
  console.log("Respuesta de imagen regular:", data);
  return data;
}

/**
 * Actualiza una imagen existente
 */
export async function updateImage(id: string, data: Partial<Image>): Promise<Image> {
  console.log('Enviando actualización a la API:', {
    id,
    ...data
  });

  const response = await authenticatedFetch(`${API_URL}/api/images/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      // Asegurarnos de que isHighlight se envía como booleano
      ...(typeof data.isHighlight === 'boolean' && { isHighlight: data.isHighlight })
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Error en la respuesta:', {
      status: response.status,
      statusText: response.statusText,
      error
    });
    throw new Error('Error al actualizar imagen');
  }

  const updatedImage = await response.json();
  console.log('Respuesta de la API:', updatedImage);
  return updatedImage;
}

/**
 * Elimina una imagen
 */
export async function deleteImage(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_URL}/api/images/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al eliminar imagen');
  }
} 