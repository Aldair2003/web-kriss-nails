'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, PlusIcon, MinusIcon, ExclamationTriangleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { createAppointment } from '@/services/appointment-service';
import { getActiveServices, type Service } from '@/services/service-service';
import { getAvailableDates } from '@/services/availability-service';
import { useAppointments } from '@/contexts/AppointmentContext';
import { DatePicker } from './DatePicker';

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
  const { addAppointment, appointments } = useAppointments();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

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
        console.log('📅 Fechas disponibles cargadas:', datesData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // ✅ DEBUG: Verificar que las citas se carguen correctamente
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      console.log('📅 Citas cargadas en NewAppointmentModal:', appointments.length);
      appointments.forEach((apt, index) => {
        const aptDate = new Date(apt.date);
        console.log(`   Cita ${index + 1}: ${apt.clientName} - ${aptDate.toLocaleString()}`);
      });
    } else {
      console.log('📅 No hay citas cargadas en NewAppointmentModal');
    }
  }, [appointments]);

  // Configurar valores iniciales cuando se abre el modal
  useEffect(() => {
    if (open && slot) {
      setValue('date', format(slot.start, 'yyyy-MM-dd HH:mm:ss'));
    }
  }, [open, slot, setValue]);

  // Validar fecha seleccionada
  useEffect(() => {
    if (selectedDateTime) {
      const dateOnly = format(selectedDateTime, 'yyyy-MM-dd');
      if (!availableDates.includes(dateOnly)) {
        setDateError('Esta fecha no está habilitada para trabajo');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [selectedDateTime, availableDates]);

  // Función para verificar si una fecha está habilitada
  const isDateEnabled = (dateString: string) => {
    const dateOnly = dateString.split('T')[0];
    return availableDates.includes(dateOnly);
  };

  // Función para verificar si un horario tiene conflicto con citas existentes
  const hasTimeConflict = (date: Date, hour: number, minute: number, serviceDuration: number): boolean => {
    if (!appointments || appointments.length === 0) return false;
    
    const selectedDate = new Date(date);
    selectedDate.setHours(hour, minute, 0, 0);
    
    const selectedEndTime = new Date(selectedDate);
    selectedEndTime.setMinutes(selectedEndTime.getMinutes() + serviceDuration);
    
    // Verificar si hay citas en la misma fecha que se superponen
    const conflictingAppointments = appointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.date);
      const appointmentEndTime = new Date(appointmentDate);
      const appointmentDuration = typeof appointment.service.duration === 'string' 
        ? parseDuration(appointment.service.duration) 
        : (appointment.service.duration || 60);
      appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + appointmentDuration);
      
      // Verificar si hay superposición
      return (
        appointmentDate.getDate() === selectedDate.getDate() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        (
          (selectedDate < appointmentEndTime && selectedEndTime > appointmentDate) ||
          (appointmentDate < selectedEndTime && appointmentEndTime > selectedDate)
        )
      );
    });
    
    return conflictingAppointments.length > 0;
  };

  // Función para obtener el siguiente día habilitado
  const getNextEnabledDate = () => {
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateString = format(checkDate, 'yyyy-MM-dd');
      if (availableDates.includes(dateString)) {
        return checkDate;
      }
    }
    return today;
  };

  // Manejar selección de fecha y hora
  const handleDateTimeSelect = (dateTime: Date) => {
    setSelectedDateTime(dateTime);
    setValue('date', format(dateTime, 'yyyy-MM-dd HH:mm:ss'));
    setDateError('');
    setShowDatePicker(false);
  };

  // Recargar horarios cuando cambie el servicio seleccionado
  useEffect(() => {
    if (selectedService && selectedDateTime) {
      // Mantener la hora actual, solo actualizar la fecha si es necesario
      const newDateTime = new Date(selectedDateTime);
      setSelectedDateTime(newDateTime);
      setValue('date', format(newDateTime, 'yyyy-MM-dd HH:mm:ss'));
    }
  }, [selectedService, setValue]);

  // Abrir selector de fecha
  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  // Función para convertir duración de formato "HH:MM" a minutos
  const parseDuration = (duration: string | number): number => {
    if (!duration) return 0;
    
    // Si ya es un número, retornarlo
    if (typeof duration === 'number') {
      return duration;
    }
    
    // Si es string y es un número, convertirlo
    if (!isNaN(Number(duration))) {
      return Number(duration);
    }
    
    // Si es formato "HH:MM"
    if (duration.includes(':')) {
      const [hours, minutes] = duration.split(':').map(Number);
      return (hours * 60) + minutes;
    }
    
    return 0;
  };

  // Calcular totales
  const totalPrice = selectedService ? Number(selectedService.price || 0) : 0;
  const totalDuration = selectedService && selectedService.duration ? parseDuration(String(selectedService.duration)) : 0;

  const toggleService = (service: Service) => {
    setSelectedService(prev => prev?.id === service.id ? null : service);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedService) {
      alert('Selecciona un servicio');
      return;
    }

    if (!selectedDateTime) {
      setDateError('Debes seleccionar una fecha y hora');
      return;
    }

    // Validar que la fecha esté habilitada
    const dateOnly = format(selectedDateTime, 'yyyy-MM-dd');
    if (!availableDates.includes(dateOnly)) {
      setDateError('No se puede crear una cita en una fecha no habilitada');
      return;
    }

    try {
      setIsSubmitting(true);

      // Enviar la fecha en formato ISO para preservar la zona horaria
      const appointmentDate = selectedDateTime!.toISOString();
      console.log('📅 Fecha que se enviará al backend:', appointmentDate);
      console.log('📅 selectedDateTime original:', selectedDateTime);

      const newAppointment = await createAppointment({
        ...data,
        date: appointmentDate,
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
        setSelectedDateTime(null);
        setShowDatePicker(false);
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
    setSelectedDateTime(null);
    setShowDatePicker(false);
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
                {/* ✅ SELECCIÓN DE SERVICIOS PRIMERO */}
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
                                {service.duration ? (() => {
                                  const durationInMinutes = parseDuration(service.duration);
                                  if (durationInMinutes > 0) {
                                    const hours = Math.floor(durationInMinutes / 60);
                                    const minutes = durationInMinutes % 60;
                                    if (hours > 0 && minutes === 0) {
                                      return `${hours}h`;
                                    } else if (hours > 0) {
                                      return `${hours}:${minutes.toString().padStart(2, '0')}h`;
                                    } else {
                                      return `${minutes}min`;
                                    }
                                  }
                                  return 'Duración no definida';
                                })() : 'Duración no definida'}
                              </span>
                            </div>
                          </div>
                          {selectedService?.id === service.id && (
                            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!selectedService && (
                    <p className="mt-2 text-sm text-red-600">Debes seleccionar un servicio</p>
                  )}
                </div>

                {/* Información de fecha y hora */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Fecha *
                     </label>
                     
                     {/* Campo de fecha seleccionada */}
                     <div className="relative">
                       <input
                         type="text"
                         value={selectedDateTime ? format(selectedDateTime, 'dd/MM/yyyy') : ''}
                         placeholder="Selecciona fecha"
                         readOnly
                         onClick={openDatePicker}
                         className={`w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                           dateError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                         } hover:border-pink-300 hover:bg-pink-50`}
                       />
                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                         <CalendarIcon className="w-5 h-5 text-gray-400" />
                       </div>
                     </div>

                     {/* Mensajes de validación */}
                     {dateError && (
                       <div className="flex items-center gap-2 mt-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg">
                         <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                         <span>{dateError}</span>
                       </div>
                     )}
                     
                     {!dateError && selectedDateTime && (
                       <div className="flex items-center gap-2 mt-2 text-green-600 text-sm bg-green-50 p-2 rounded-lg">
                         <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                         <span>Fecha seleccionada correctamente</span>
                       </div>
                     )}
                     
                     {errors.date && (
                       <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                     )}
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Hora *
                     </label>
                     
                                           {/* Selector de hora */}
                    {/* ✅ SOLO MOSTRAR HORAS SI HAY SERVICIO SELECCIONADO */}
                    {!selectedService ? (
                      <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                        Selecciona un servicio primero para ver las horas disponibles
                      </div>
                    ) : selectedDateTime ? (
                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-white">
                        {Array.from({ length: 34 }, (_, i) => {
                          const hour = Math.floor(i / 2) + 6; // Empezar desde 6 AM
                          const minute = (i % 2) * 30; // 0 o 30 minutos
                          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                          const isSelected = selectedDateTime && 
                            selectedDateTime.getHours() === hour && 
                            selectedDateTime.getMinutes() === minute;
                          
                          // ✅ LÓGICA CORREGIDA: Verificar conflictos automáticamente
                          let isTimeValid = true;
                          let conflictReason = '';
                          
                          if (selectedService && selectedService.duration) {
                            const serviceDuration = parseDuration(selectedService.duration);
                            
                            // Verificar que termine antes de las 11 PM
                            const startTime = new Date(selectedDateTime);
                            startTime.setHours(hour, minute, 0, 0);
                            
                            const endTime = new Date(startTime);
                            endTime.setMinutes(endTime.getMinutes() + serviceDuration);
                            
                            if (endTime.getHours() > 23 || (endTime.getHours() === 23 && endTime.getMinutes() > 0)) {
                              isTimeValid = false;
                              conflictReason = 'Fuera del horario de trabajo';
                            }
                            
                            // ✅ VERIFICAR CONFLICTOS CON CITAS EXISTENTES
                            if (isTimeValid && appointments && appointments.length > 0) {
                              console.log(`🔍 Verificando hora ${time} con ${appointments.length} citas existentes`);
                              
                              // Buscar citas en la misma fecha
                              const sameDateAppointments = appointments.filter((appointment: any) => {
                                const appointmentDate = new Date(appointment.date);
                                const selectedDate = new Date(selectedDateTime);
                                
                                // Comparar solo la fecha (sin hora)
                                const sameDate = (
                                  appointmentDate.getDate() === selectedDate.getDate() &&
                                  appointmentDate.getMonth() === selectedDate.getMonth() &&
                                  appointmentDate.getFullYear() === selectedDate.getFullYear()
                                );
                                
                                if (sameDate) {
                                  console.log(`📅 Cita en misma fecha: ${appointment.clientName} - ${appointmentDate.toLocaleString()}`);
                                }
                                
                                return sameDate;
                              });
                              
                              console.log(`📅 Citas en misma fecha encontradas: ${sameDateAppointments.length}`);
                              
                              // Verificar superposición con cada cita existente
                              for (const existingAppointment of sameDateAppointments) {
                                const existingStart = new Date(existingAppointment.date);
                                const existingEnd = new Date(existingStart);
                                const existingDuration = typeof existingAppointment.service.duration === 'string' 
                                  ? parseDuration(existingAppointment.service.duration) 
                                  : (existingAppointment.service.duration || 60);
                                existingEnd.setMinutes(existingEnd.getMinutes() + existingDuration);
                                
                                console.log(`   Comparando con: ${existingAppointment.clientName}`);
                                console.log(`     Existente: ${existingStart.toLocaleTimeString()} - ${existingEnd.toLocaleTimeString()}`);
                                console.log(`     Nueva: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
                                
                                // ✅ LÓGICA CORREGIDA: Cualquier hora que empiece dentro del rango ocupado es inválida
                                // 1. Si la nueva cita empieza ANTES de que termine la existente
                                // 2. Y la nueva cita termina DESPUÉS de que empiece la existente
                                // ENTONCES hay conflicto
                                const hasConflict = (
                                  (startTime < existingEnd && endTime > existingStart)
                                );
                                
                                console.log(`     ¿Hay conflicto? ${hasConflict}`);
                                
                                if (hasConflict) {
                                  isTimeValid = false;
                                  conflictReason = `Conflicto con: ${existingAppointment.clientName}`;
                                  console.log(`🚨 CONFLICTO DETECTADO en ${time}: ${conflictReason}`);
                                  break;
                                }
                              }
                            }
                          }
                          
                          // ✅ DEBUG: Mostrar estado final de validación
                          console.log(`🎨 Hora ${time}: isTimeValid=${isTimeValid}, conflictReason="${conflictReason}"`);
                          
                          return (
                            <div key={time} className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isTimeValid) {
                                    const newDateTime = new Date(selectedDateTime);
                                    newDateTime.setHours(hour, minute, 0, 0);
                                    setSelectedDateTime(newDateTime);
                                    setValue('date', format(newDateTime, 'yyyy-MM-dd HH:mm:ss'));
                                  }
                                }}
                                disabled={!isTimeValid}
                                title={!isTimeValid ? conflictReason : `Seleccionar ${time}`}
                                className={`w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                                    : isTimeValid
                                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-pink-50 hover:border-pink-300'
                                    : 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed opacity-75'
                                }`}
                              >
                                {time}
                              </button>
                              
                              {/* ✅ INDICADOR VISUAL: Mostrar por qué está desactivada */}
                              {!isTimeValid && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                        Selecciona una fecha primero
                      </div>
                    )}
                   </div>
                 </div>

                {/* Selector de fecha personalizado */}
                {showDatePicker && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                      <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Seleccionar Fecha</h3>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <XMarkIcon className="w-6 h-6" />
                        </button>
                      </div>
                      
                      <DatePicker
                        selectedDate={selectedDateTime}
                        onDateSelect={handleDateTimeSelect}
                        availableDates={availableDates}
                        className="border-0 shadow-none"
                      />
                    </div>
                  </div>
                )}

                                 {/* Indicador de días habilitados */}
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <span className="text-sm font-medium text-blue-800">Información de Disponibilidad</span>
                   </div>
                    <div className="text-sm text-blue-700">
                      <p>• Solo se pueden crear citas en días habilitados para trabajo</p>
                      <p>• Días habilitados: <span className="font-semibold">{availableDates.length}</span> días disponibles</p>
                      <p>• Horario de trabajo: 6:00 AM - 11:00 PM</p>
                      {selectedService && selectedService.duration && (
                        <p>• Duración del servicio: <span className="font-semibold">{(() => {
                          const durationInMinutes = parseDuration(selectedService.duration);
                          if (durationInMinutes > 0) {
                            const hours = Math.floor(durationInMinutes / 60);
                            const minutes = durationInMinutes % 60;
                            if (hours > 0 && minutes === 0) {
                              return `${hours}h`;
                            } else if (hours > 0) {
                              return `${hours}:${minutes.toString().padStart(2, '0')}h`;
                            } else {
                              return `${minutes}min`;
                            }
                          }
                          return 'No definida';
                        })()}</span></p>
                      )}
                      
                      {/* Mostrar citas existentes en la fecha seleccionada */}
                      {selectedDateTime && appointments && appointments.length > 0 && (() => {
                        const selectedDate = format(selectedDateTime, 'yyyy-MM-dd');
                        const dayAppointments = appointments.filter(apt => {
                          const aptDate = new Date(apt.date);
                          return format(aptDate, 'yyyy-MM-dd') === selectedDate;
                        });
                        
                        if (dayAppointments.length > 0) {
                          return (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <p className="font-medium text-blue-800 mb-2">Citas existentes en esta fecha:</p>
                              {dayAppointments.map((apt, index) => {
                                const aptDate = new Date(apt.date);
                                const aptEndTime = new Date(aptDate);
                                const aptDuration = typeof apt.service.duration === 'string' 
                                  ? parseDuration(apt.service.duration) 
                                  : (apt.service.duration || 60);
                                aptEndTime.setMinutes(aptEndTime.getMinutes() + aptDuration);
                                
                                return (
                                  <div key={index} className="flex items-center justify-between text-xs bg-blue-100 p-2 rounded mb-1">
                                    <span className="text-blue-700">
                                      {format(aptDate, 'HH:mm')} - {format(aptEndTime, 'HH:mm')}
                                    </span>
                                    <span className="text-blue-600 font-medium">{apt.clientName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        return null;
                      })()}
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

                {/* Resumen */}
                 {selectedService && (
                   <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                     <h4 className="font-semibold text-gray-900 mb-2">Resumen de la Cita</h4>
                     <div className="flex items-center justify-between text-sm">
                       <span>Servicio: {selectedService.name}</span>
                       <span className="font-semibold">${totalPrice}</span>
                     </div>
                                           <div className="flex items-center justify-between text-sm">
                        <span>Duración: {totalDuration > 0 && !isNaN(totalDuration) ? (() => {
                          const hours = Math.floor(totalDuration / 60);
                          const minutes = totalDuration % 60;
                          if (hours > 0 && minutes === 0) {
                            return `${hours}h`;
                          } else if (hours > 0) {
                            return `${hours}:${minutes.toString().padStart(2, '0')}h`;
                          } else {
                            return `${minutes}min`;
                          }
                        })() : 'No definida'}</span>
                      </div>
                                           {selectedDateTime && totalDuration > 0 && !isNaN(totalDuration) && (
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-pink-200">
                          <span>Inicio: {format(selectedDateTime, 'HH:mm')}</span>
                          <span>Fin: {format(new Date(selectedDateTime.getTime() + (totalDuration * 60000)), 'HH:mm')}</span>
                        </div>
                      )}
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
                    disabled={!selectedService || !selectedDateTime || isSubmitting || !!dateError}
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
