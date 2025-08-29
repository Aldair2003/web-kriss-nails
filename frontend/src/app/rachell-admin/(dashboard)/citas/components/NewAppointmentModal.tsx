'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { createAppointment } from '@/services/appointment-service';
import { getActiveServices, type Service } from '@/services/service-service';

const appointmentSchema = z.object({
  clientName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  clientPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  date: z.string().min(1, 'Fecha es requerida'),
  notes: z.string().optional()
});

type FormData = z.infer<typeof appointmentSchema>;

interface NewAppointmentModalProps {
  open: boolean;
  slot: { start: Date; end: Date } | null;
  onClose: () => void;
  onCreate: () => void;
}

export function NewAppointmentModal({
  open,
  slot,
  onClose,
  onCreate
}: NewAppointmentModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(appointmentSchema)
  });

  // Cargar servicios
  useEffect(() => {
    const loadServices = async () => {
      try {
        const servicesData = await getActiveServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Error cargando servicios:', error);
      }
    };

    if (open) {
      loadServices();
    }
  }, [open]);

  // Configurar valores iniciales cuando se abre el modal
  useEffect(() => {
    if (open && slot) {
      setValue('date', format(slot.start, 'yyyy-MM-dd HH:mm:ss'));
    }
  }, [open, slot, setValue]);

  // Calcular totales
  const totalPrice = selectedService ? Number(selectedService.price || 0) : 0;
  const totalDuration = selectedService ? (selectedService.duration || 0) : 0;

  const toggleService = (service: Service) => {
    setSelectedService(prev => prev?.id === service.id ? null : service);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedService) {
      alert('Selecciona un servicio');
      return;
    }

    try {
      setIsSubmitting(true);

      await createAppointment({
        ...data,
        serviceId: selectedService.id
      });

      setIsSuccess(true);

      // Después de 2 segundos, cerrar y notificar
      setTimeout(() => {
        setIsSuccess(false);
        reset();
        setSelectedService(null);
        onCreate();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error creando cita:', error);
      alert('Error al crear la cita. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    setSelectedService(null);
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {isSuccess ? '¡Cita Creada!' : 'Nueva Cita Manual'}
            </Dialog.Title>
            {!isSubmitting && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Cita Creada Exitosamente
                </h3>
                <p className="text-gray-600">
                  La cita ha sido registrada y el cliente será notificado por email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Información de fecha y hora */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      {...register('date')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.date && (
                      <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>
                    )}
                  </div>


                </div>

                {/* Información del cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Información del Cliente
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        {...register('clientName')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                          errors.clientName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Nombre del cliente"
                      />
                      {errors.clientName && (
                        <p className="text-red-600 text-sm mt-1">{errors.clientName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        {...register('clientPhone')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                          errors.clientPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="+593 99 123 4567"
                      />
                      {errors.clientPhone && (
                        <p className="text-red-600 text-sm mt-1">{errors.clientPhone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                                          <input
                        type="email"
                        {...register('clientEmail')}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                          errors.clientEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="cliente@email.com (opcional)"
                      />
                    {errors.clientEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientEmail.message}</p>
                    )}
                  </div>
                </div>

                {/* Selección de servicios */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Servicios
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(service => (
                      <div 
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedService?.id === service.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          {selectedService?.id === service.id ? (
                            <MinusIcon className="w-5 h-5 text-pink-600" />
                          ) : (
                            <PlusIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-pink-600 font-medium">
                            ${Number(service.price || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            {service.duration || 0} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedService && (
                    <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{selectedService.name}</span>
                          <span>${Number(selectedService.price || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="border-t border-pink-200 mt-2 pt-2 flex justify-between font-medium">
                        <span>Total: {totalDuration} minutos</span>
                        <span>${totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Notas sobre la cita..."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedService}
                    className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Cita'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
