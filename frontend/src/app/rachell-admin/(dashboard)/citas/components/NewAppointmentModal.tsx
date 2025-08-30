'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, PlusIcon, MinusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createAppointment } from '@/services/appointment-service';
import { getActiveServices, type Service } from '@/services/service-service';
import { getAvailableDates } from '@/services/availability-service';
import { useAppointments } from '@/contexts/AppointmentContext';

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
  const { addAppointment } = useAppointments();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<FormData>({
    resolver: zodResolver(appointmentSchema)
  });

  const selectedDate = watch('date');

  // Cargar servicios y fechas disponibles
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, datesData] = await Promise.all([
          getActiveServices(),
          getAvailableDates(new Date().getMonth() + 1, new Date().getFullYear())
        ]);
        setServices(servicesData);
        setAvailableDates(datesData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Configurar valores iniciales cuando se abre el modal
  useEffect(() => {
    if (open && slot) {
      setValue('date', format(slot.start, 'yyyy-MM-dd HH:mm:ss'));
    }
  }, [open, slot, setValue]);

  // Validar fecha seleccionada
  useEffect(() => {
    if (selectedDate) {
      const dateOnly = selectedDate.split('T')[0];
      if (!availableDates.includes(dateOnly)) {
        setDateError('Esta fecha no está habilitada para trabajo');
      } else {
        setDateError('');
      }
    }
  }, [selectedDate, availableDates]);

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

    // Validar que la fecha esté habilitada
    const dateOnly = data.date.split('T')[0];
    if (!availableDates.includes(dateOnly)) {
      alert('No se puede crear una cita en una fecha no habilitada');
      return;
    }

    try {
      setIsSubmitting(true);

      const newAppointment = await createAppointment({
        ...data,
        serviceId: selectedService.id
      });

      // Agregar la nueva cita al contexto
      addAppointment(newAppointment);

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
    setDateError('');
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
                      type="datetime-local"
                      {...register('date')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${
                        dateError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      min={format(new Date(), 'yyyy-MM-ddTHH:mm')}
                    />
                    {dateError && (
                      <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        <span>{dateError}</span>
                      </div>
                    )}
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                </div>

                {/* Información del cliente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      {...register('clientName')}
                      placeholder="Nombre del cliente"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    />
                    {errors.clientName && (
                      <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      {...register('clientPhone')}
                      placeholder="+593 99 123 4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    />
                    {errors.clientPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.clientPhone.message}</p>
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
                    placeholder="cliente@email.com (opcional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  />
                  {errors.clientEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.clientEmail.message}</p>
                  )}
                </div>

                {/* Selección de servicios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Servicios *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedService?.id === service.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-lg font-bold text-pink-600">
                                ${service.price}
                              </span>
                              <span className="text-sm text-gray-500">
                                {Math.floor((service.duration || 0) / 60)}:{((service.duration || 0) % 60).toString().padStart(2, '0')} min
                              </span>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedService?.id === service.id
                              ? 'border-pink-500 bg-pink-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedService?.id === service.id && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                {selectedService && (
                  <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Resumen de la Cita</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span>Servicio: {selectedService.name}</span>
                      <span className="font-semibold">${totalPrice}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Duración: {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')} min</span>
                    </div>
                  </div>
                )}

                {/* Notas adicionales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Notas sobre la cita..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors resize-none"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedService || isSubmitting || !!dateError}
                    className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Cita'}
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
