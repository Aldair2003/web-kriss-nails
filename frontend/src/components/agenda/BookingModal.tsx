'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { type AvailableSlot, createAppointment } from '@/services/appointment-service';
import { type Service } from '@/services/service-service';

const bookingSchema = z.object({
  clientName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  clientEmail: z.string().email('Email inválido'),
  clientPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  notes: z.string().optional()
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  open: boolean;
  slot: AvailableSlot | null;
  services: Service[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingModal({
  open,
  slot,
  services,
  onClose,
  onSuccess
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema)
  });

  const totalPrice = services.reduce((total, service) => total + Number(service.price || 0), 0);
  const totalDuration = services.reduce((total, service) => total + (service.duration || 0), 0);

  const onSubmit = async (data: BookingFormData) => {
    if (!slot) return;

    try {
      setIsSubmitting(true);
      
      await createAppointment({
        ...data,
        date: slot.date,
        startTime: slot.startTime,
        serviceIds: services.map(s => s.id)
      });

      setIsSuccess(true);
      
      // Después de 2 segundos, cerrar y notificar éxito
      setTimeout(() => {
        setIsSuccess(false);
        reset();
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Error al crear la cita:', error);
      alert('Error al crear la cita. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    setIsSuccess(false);
    onClose();
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {isSuccess ? '¡Cita Solicitada!' : 'Confirmar Reserva'}
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
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Solicitud Enviada!
                </h3>
                <p className="text-gray-600 mb-4">
                  Tu solicitud de cita ha sido enviada exitosamente.
                  Rachell revisará tu solicitud y te contactará pronto para confirmarla.
                </p>
                <div className="bg-pink-50 rounded-lg p-4 text-left">
                  <h4 className="font-medium text-pink-900 mb-2">
                    Próximos pasos:
                  </h4>
                  <ul className="text-sm text-pink-800 space-y-1">
                    <li>• Recibirás un email de confirmación</li>
                    <li>• Rachell revisará tu solicitud</li>
                    <li>• Te contactaremos para confirmar la cita</li>
                    <li>• Recibirás recordatorios antes de tu cita</li>
                  </ul>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Resumen de la cita */}
                <div className="bg-pink-50 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-900 mb-3">
                    Resumen de tu Cita
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-pink-800">Fecha:</span>
                      <span className="font-medium text-pink-900">
                        {format(new Date(slot.date), 'EEEE, d MMMM yyyy', { locale: es })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-800">Hora:</span>
                      <span className="font-medium text-pink-900">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-pink-800">Duración:</span>
                      <span className="font-medium text-pink-900">
                        {totalDuration} minutos
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-pink-200">
                    <h4 className="font-medium text-pink-900 mb-2">Servicios:</h4>
                    <div className="space-y-1">
                      {services.map(service => (
                        <div key={service.id} className="flex justify-between text-sm">
                          <span className="text-pink-800">{service.name}</span>
                          <span className="font-medium text-pink-900">
                            ${Number(service.price || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-semibold text-pink-900 mt-2 pt-2 border-t border-pink-200">
                      <span>Total:</span>
                      <span>${totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Formulario de datos del cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tus Datos
                  </h3>

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
                      placeholder="Tu nombre completo"
                    />
                    {errors.clientName && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('clientEmail')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                        errors.clientEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                    />
                    {errors.clientEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.clientEmail.message}</p>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Adicionales
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Alguna preferencia especial, alergias, o comentario adicional..."
                    />
                  </div>
                </div>

                {/* Información importante */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Información Importante:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Tu cita estará pendiente de confirmación por parte de Rachell</li>
                    <li>• Recibirás un email cuando tu cita sea confirmada</li>
                    <li>• Para cancelar o reprogramar, hazlo con al menos 24 horas de anticipación</li>
                    <li>• Llega 5 minutos antes de tu cita</li>
                  </ul>
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
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : (
                      'Solicitar Cita'
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
