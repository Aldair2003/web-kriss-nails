export const apiDocumentation = {
  openapi: '3.0.0',
  info: {
    title: 'API de Rachell Nails',
    version: '1.0.0',
    description: 'API para el sistema de gestión de citas de Rachell Nails',
    contact: {
      name: 'Rachell Nails',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Servidor de desarrollo',
    }
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Endpoints de autenticación'
    },
    {
      name: 'Appointments',
      description: 'Gestión de citas'
    },
    {
      name: 'Services',
      description: 'Gestión de servicios'
    },
    {
      name: 'Gallery',
      description: 'Gestión de imágenes'
    },
    {
      name: 'Reviews',
      description: 'Gestión de reseñas'
    },
    {
      name: 'Availability',
      description: 'Gestión de disponibilidad y horarios'
    },
    {
      name: 'Notifications',
      description: 'Sistema de notificaciones'
    },
    {
      name: 'Drive',
      description: 'Gestión de archivos en Google Drive'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email del administrador'
          },
          password: {
            type: 'string',
            description: 'Contraseña del administrador'
          }
        }
      },
      AppointmentRequest: {
        type: 'object',
        required: ['clientName', 'clientPhone', 'serviceId', 'date'],
        properties: {
          clientName: {
            type: 'string',
            description: 'Nombre del cliente'
          },
          clientPhone: {
            type: 'string',
            description: 'Teléfono del cliente'
          },
          clientEmail: {
            type: 'string',
            format: 'email',
            description: 'Email del cliente (opcional)'
          },
          serviceId: {
            type: 'string',
            description: 'ID del servicio seleccionado'
          },
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de la cita'
          },
          notes: {
            type: 'string',
            description: 'Notas adicionales (opcional)'
          }
        }
      },
      ServiceRequest: {
        type: 'object',
        required: ['name', 'description', 'price', 'duration', 'categoryId'],
        properties: {
          name: {
            type: 'string',
            description: 'Nombre del servicio'
          },
          description: {
            type: 'string',
            description: 'Descripción del servicio'
          },
          price: {
            type: 'number',
            format: 'decimal',
            description: 'Precio regular del servicio'
          },
          duration: {
            type: 'string',
            description: 'Duración del servicio (formato HH:MM o decimal)'
          },
          categoryId: {
            type: 'string',
            description: 'ID de la categoría del servicio'
          },
          isActive: {
            type: 'boolean',
            description: 'Estado de disponibilidad del servicio',
            default: true
          },
          isHighlight: {
            type: 'boolean',
            description: 'Indica si el servicio está destacado',
            default: false
          },
          hasOffer: {
            type: 'boolean',
            description: 'Indica si el servicio tiene oferta',
            default: false
          },
          offerPrice: {
            type: 'number',
            format: 'decimal',
            description: 'Precio de oferta (requerido si hasOffer es true)'
          },
          order: {
            type: 'integer',
            description: 'Orden de visualización del servicio',
            default: 0
          }
        }
      },
      ImageRequest: {
        type: 'object',
        required: ['url', 'type'],
        properties: {
          url: {
            type: 'string',
            description: 'URL de la imagen'
          },
          type: {
            type: 'string',
            enum: ['GALLERY', 'BEFORE_AFTER', 'SERVICE'],
            description: 'Tipo de imagen'
          },
          category: {
            type: 'string',
            description: 'Categoría de la imagen (opcional)'
          },
          serviceId: {
            type: 'string',
            description: 'ID del servicio relacionado (opcional)'
          }
        }
      },
      ReviewRequest: {
        type: 'object',
        required: ['clientName', 'rating', 'comment'],
        properties: {
          clientName: {
            type: 'string',
            description: 'Nombre del cliente'
          },
          rating: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Calificación (1-5 estrellas)'
          },
          comment: {
            type: 'string',
            description: 'Comentario de la reseña'
          }
        }
      },
      AvailabilityRequest: {
        type: 'object',
        required: ['date', 'isAvailable'],
        properties: {
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Indica si está disponible'
          }
        }
      },
      NotificationRequest: {
        type: 'object',
        required: ['type', 'recipient'],
        properties: {
          type: {
            type: 'string',
            enum: ['WHATSAPP', 'EMAIL'],
            description: 'Tipo de notificación'
          },
          recipient: {
            type: 'string',
            description: 'Destinatario (teléfono o email)'
          },
          message: {
            type: 'string',
            description: 'Mensaje a enviar'
          }
        }
      },
      DriveFileResponse: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID del archivo en Google Drive'
          },
          name: {
            type: 'string',
            description: 'Nombre del archivo'
          },
          mimeType: {
            type: 'string',
            description: 'Tipo MIME del archivo'
          },
          webViewLink: {
            type: 'string',
            description: 'URL para ver el archivo'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Mensaje de error'
          },
          code: {
            type: 'string',
            description: 'Código de error interno'
          },
          details: {
            type: 'object',
            description: 'Detalles adicionales del error'
          }
        },
        example: {
          message: 'Error de validación',
          code: 'VALIDATION_ERROR',
          details: {
            field: 'email',
            error: 'El email es requerido'
          }
        }
      },
      TokenResponse: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'Token JWT de acceso'
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' }
            }
          }
        },
        example: {
          accessToken: 'eyJhbGciOiJIUzI1NiIs...',
          user: {
            id: '1',
            name: 'Admin',
            email: 'admin@example.com',
            role: 'ADMIN'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'No autorizado - Token inválido o expirado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              message: 'Token inválido o expirado',
              code: 'INVALID_TOKEN'
            }
          }
        }
      },
      ValidationError: {
        description: 'Error de validación en los datos enviados',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              message: 'Error de validación',
              code: 'VALIDATION_ERROR',
              details: {
                field: 'password',
                error: 'La contraseña debe tener al menos 6 caracteres'
              }
            }
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login de administrador',
        description: 'Endpoint para autenticar administradores',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: {
                      type: 'string',
                      description: 'JWT token de acceso'
                    },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Credenciales inválidas'
          }
        }
      }
    },
    '/api/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'Obtener todas las citas',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de citas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/AppointmentRequest'
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Appointments'],
        summary: 'Crear nueva cita',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppointmentRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Cita creada exitosamente'
          },
          400: {
            description: 'Datos inválidos'
          }
        }
      }
    },
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'Obtener todos los servicios',
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
              default: 1
            },
            description: 'Número de página'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              default: 10
            },
            description: 'Cantidad de items por página'
          },
          {
            in: 'query',
            name: 'categoryId',
            schema: {
              type: 'string'
            },
            description: 'Filtrar por categoría'
          },
          {
            in: 'query',
            name: 'isActive',
            schema: {
              type: 'boolean'
            },
            description: 'Filtrar por estado de disponibilidad'
          },
          {
            in: 'query',
            name: 'isHighlight',
            schema: {
              type: 'boolean'
            },
            description: 'Filtrar servicios destacados'
          },
          {
            in: 'query',
            name: 'hasOffer',
            schema: {
              type: 'boolean'
            },
            description: 'Filtrar servicios con oferta'
          },
          {
            in: 'query',
            name: 'minPrice',
            schema: {
              type: 'number'
            },
            description: 'Precio mínimo'
          },
          {
            in: 'query',
            name: 'maxPrice',
            schema: {
              type: 'number'
            },
            description: 'Precio máximo'
          },
          {
            in: 'query',
            name: 'search',
            schema: {
              type: 'string'
            },
            description: 'Búsqueda por nombre o descripción'
          },
          {
            in: 'query',
            name: 'sortBy',
            schema: {
              type: 'string',
              enum: ['order', 'price', 'name'],
              default: 'order'
            },
            description: 'Campo por el cual ordenar'
          },
          {
            in: 'query',
            name: 'sortOrder',
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'asc'
            },
            description: 'Dirección del ordenamiento'
          }
        ],
        responses: {
          200: {
            description: 'Lista de servicios paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    services: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/ServiceRequest'
                      }
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: {
                          type: 'integer',
                          description: 'Total de servicios'
                        },
                        page: {
                          type: 'integer',
                          description: 'Página actual'
                        },
                        limit: {
                          type: 'integer',
                          description: 'Items por página'
                        },
                        totalPages: {
                          type: 'integer',
                          description: 'Total de páginas'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Services'],
        summary: 'Crear nuevo servicio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Servicio creado exitosamente'
          },
          400: {
            description: 'Datos inválidos'
          }
        }
      }
    },
    '/api/images': {
      get: {
        tags: ['Gallery'],
        summary: 'Obtener todas las imágenes',
        parameters: [
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['GALLERY', 'BEFORE_AFTER', 'SERVICE']
            },
            description: 'Filtrar por tipo de imagen'
          }
        ],
        responses: {
          200: {
            description: 'Lista de imágenes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ImageRequest'
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Gallery'],
        summary: 'Subir nueva imagen',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ImageRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Imagen subida exitosamente'
          },
          400: {
            description: 'Datos inválidos'
          }
        }
      }
    },
    '/api/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'Obtener todas las reseñas',
        parameters: [
          {
            in: 'query',
            name: 'isApproved',
            schema: {
              type: 'boolean'
            },
            description: 'Filtrar por estado de aprobación'
          }
        ],
        responses: {
          200: {
            description: 'Lista de reseñas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/ReviewRequest'
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Reviews'],
        summary: 'Crear nueva reseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReviewRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Reseña creada exitosamente'
          },
          400: {
            description: 'Datos inválidos'
          }
        }
      }
    },
    '/api/availability': {
      get: {
        tags: ['Availability'],
        summary: 'Obtener horarios disponibles',
        parameters: [
          {
            in: 'query',
            name: 'startDate',
            schema: {
              type: 'string',
              format: 'date'
            },
            description: 'Fecha inicial'
          },
          {
            in: 'query',
            name: 'endDate',
            schema: {
              type: 'string',
              format: 'date'
            },
            description: 'Fecha final'
          }
        ],
        responses: {
          200: {
            description: 'Lista de horarios disponibles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/AvailabilityRequest'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/availability/admin': {
      post: {
        tags: ['Availability'],
        summary: 'Crear disponibilidad',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AvailabilityRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Disponibilidad creada exitosamente'
          },
          400: {
            description: 'Datos inválidos'
          }
        }
      }
    },
    '/api/availability/admin/{id}': {
      put: {
        tags: ['Availability'],
        summary: 'Actualizar disponibilidad',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la disponibilidad'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AvailabilityRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Disponibilidad actualizada exitosamente'
          },
          404: {
            description: 'Disponibilidad no encontrada'
          }
        }
      },
      delete: {
        tags: ['Availability'],
        summary: 'Eliminar disponibilidad',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la disponibilidad'
          }
        ],
        responses: {
          200: {
            description: 'Disponibilidad eliminada exitosamente'
          },
          404: {
            description: 'Disponibilidad no encontrada'
          }
        }
      }
    },
    '/api/notifications/whatsapp': {
      post: {
        tags: ['Notifications'],
        summary: 'Enviar notificación WhatsApp',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Notificación enviada exitosamente'
          },
          400: {
            description: 'Datos inválidos'
          }
        }
      }
    },
    '/api/notifications/admin': {
      get: {
        tags: ['Notifications'],
        summary: 'Obtener historial de notificaciones',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de notificaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/NotificationRequest'
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/drive/upload': {
      post: {
        tags: ['Drive'],
        summary: 'Subir un archivo',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Archivo a subir (máximo 5MB)'
                  },
                  type: {
                    type: 'string',
                    enum: ['GALLERY', 'SERVICE', 'BEFORE_AFTER'],
                    description: 'Tipo de imagen'
                  }
                },
                required: ['file']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Archivo subido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Archivo subido exitosamente'
                    },
                    url: {
                      type: 'string',
                      example: 'https://drive.google.com/...'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error en la solicitud',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'No se proporcionó ningún archivo'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/drive/upload/service': {
      post: {
        tags: ['Drive'],
        summary: 'Subir múltiples imágenes para un servicio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary'
                    },
                    description: 'Archivos a subir (máximo 5 archivos, 5MB cada uno)'
                  },
                  serviceId: {
                    type: 'string',
                    description: 'ID del servicio al que pertenecen las imágenes'
                  }
                },
                required: ['files', 'serviceId']
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Imágenes subidas exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000'
                      },
                      url: {
                        type: 'string',
                        example: 'https://drive.google.com/...'
                      },
                      type: {
                        type: 'string',
                        example: 'SERVICE'
                      },
                      serviceId: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000'
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error en la solicitud',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'No se proporcionaron archivos'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/drive/files': {
      get: {
        tags: ['Drive'],
        summary: 'Listar archivos',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['GALLERY', 'SERVICE', 'BEFORE_AFTER']
            },
            description: 'Tipo de imágenes a listar'
          },
          {
            in: 'query',
            name: 'pageSize',
            schema: {
              type: 'integer',
              default: 10
            },
            description: 'Cantidad de archivos por página'
          }
        ],
        responses: {
          200: {
            description: 'Lista de archivos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        example: 'file-id'
                      },
                      name: {
                        type: 'string',
                        example: 'imagen.jpg'
                      },
                      mimeType: {
                        type: 'string',
                        example: 'image/jpeg'
                      },
                      webViewLink: {
                        type: 'string',
                        example: 'https://drive.google.com/...'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/drive/files/{fileId}': {
      delete: {
        tags: ['Drive'],
        summary: 'Eliminar un archivo',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'fileId',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID del archivo a eliminar'
          }
        ],
        responses: {
          200: {
            description: 'Archivo eliminado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Archivo eliminado exitosamente'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/drive/files/{fileId}/share': {
      get: {
        tags: ['Drive'],
        summary: 'Obtener URL pública de un archivo',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'fileId',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID del archivo'
          }
        ],
        responses: {
          200: {
            description: 'URL pública del archivo',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      example: 'https://drive.google.com/...'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/services/{id}': {
      put: {
        tags: ['Services'],
        summary: 'Actualizar servicio',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID del servicio'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ServiceRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Servicio actualizado exitosamente'
          },
          404: {
            description: 'Servicio no encontrado'
          }
        }
      },
      delete: {
        tags: ['Services'],
        summary: 'Eliminar servicio',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID del servicio'
          }
        ],
        responses: {
          200: {
            description: 'Servicio eliminado exitosamente'
          },
          404: {
            description: 'Servicio no encontrado'
          }
        }
      }
    },
    '/api/appointments/{id}': {
      put: {
        tags: ['Appointments'],
        summary: 'Actualizar cita',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la cita'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppointmentRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Cita actualizada exitosamente'
          },
          404: {
            description: 'Cita no encontrada'
          }
        }
      },
      delete: {
        tags: ['Appointments'],
        summary: 'Cancelar cita',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la cita'
          }
        ],
        responses: {
          200: {
            description: 'Cita cancelada exitosamente'
          },
          404: {
            description: 'Cita no encontrada'
          }
        }
      }
    },
    '/api/reviews/{id}': {
      put: {
        tags: ['Reviews'],
        summary: 'Actualizar reseña',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la reseña'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ReviewRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Reseña actualizada exitosamente'
          },
          404: {
            description: 'Reseña no encontrada'
          }
        }
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Eliminar reseña',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la reseña'
          }
        ],
        responses: {
          200: {
            description: 'Reseña eliminada exitosamente'
          },
          404: {
            description: 'Reseña no encontrada'
          }
        }
      }
    },
    '/api/images/{id}': {
      delete: {
        tags: ['Gallery'],
        summary: 'Eliminar imagen',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'ID de la imagen'
          }
        ],
        responses: {
          200: {
            description: 'Imagen eliminada exitosamente'
          },
          404: {
            description: 'Imagen no encontrada'
          }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refrescar token de acceso',
        description: 'Obtiene un nuevo token de acceso usando el refresh token',
        responses: {
          200: {
            description: 'Token refrescado exitosamente',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenResponse'
                }
              }
            }
          },
          401: {
            $ref: '#/components/responses/UnauthorizedError'
          }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesión',
        description: 'Invalida el refresh token y cierra la sesión del usuario',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Sesión cerrada exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Sesión cerrada exitosamente'
                    }
                  }
                }
              }
            }
          },
          401: {
            $ref: '#/components/responses/UnauthorizedError'
          }
        }
      }
    },
    '/api/services/order/update': {
      put: {
        tags: ['Services'],
        summary: 'Actualizar orden de servicios',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['services'],
                properties: {
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'order'],
                      properties: {
                        id: {
                          type: 'string',
                          description: 'ID del servicio'
                        },
                        order: {
                          type: 'integer',
                          description: 'Nueva posición del servicio'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Orden actualizado exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Orden actualizado correctamente'
                    }
                  }
                }
              }
            }
          },
          400: {
            description: 'Error en los datos enviados'
          },
          401: {
            $ref: '#/components/responses/UnauthorizedError'
          }
        }
      }
    }
  }
}; 