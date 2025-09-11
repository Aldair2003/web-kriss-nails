'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parse, startOfWeek, getDay, addDays, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getPublicActiveServices, type Service } from '@/services/service-service';
import { useSearchParams } from 'next/navigation';
import { getPublicHoursForClient } from '@/services/public-hours-service';
import { getAppointments, createPublicAppointment, type Appointment } from '@/services/appointment-service';
import { SuccessAnimation } from '@/components/ui/SuccessAnimationreserva';

// Función para convertir duración de formato "HH:MM" a minutos
const parseDuration = (duration: string | number): number => {
  if (!duration) return 0;
  
  if (typeof duration === 'number') {
    return duration;
  }
  
  if (!isNaN(Number(duration))) {
    return Number(duration);
  }
  
  if (duration.includes(':')) {
    const [hours, minutes] = duration.split(':').map(Number);
    return (hours * 60) + minutes;
  }
  
  return 0;
};

interface BookingStep {
  id: 'service' | 'date' | 'time' | 'confirm';
  title: string;
  description: string;
  completed: boolean;
}

export function ClientCalendar() {
  // Estados principales
  const [currentStep, setCurrentStep] = useState<'service' | 'date' | 'time' | 'confirm'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Estados de datos
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [publicHours, setPublicHours] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados de UI
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Estados para la animación de éxito
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successClientName, setSuccessClientName] = useState('');

  const searchParams = useSearchParams();

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [servicesData, appointmentsData] = await Promise.all([
          getPublicActiveServices(),
          getAppointments({ limit: 1000 })
        ]);
        
        setServices(servicesData);
        setAppointments(appointmentsData.appointments);

        // Preseleccionar servicio si viene en la URL ?serviceId=...
        const serviceId = searchParams?.get('serviceId');
        if (serviceId) {
          const svc = servicesData.find(s => s.id === serviceId);
          if (svc) {
            setSelectedService(svc);
            setCurrentStep('date');
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [searchParams]);

  // Cargar horarios públicos cuando cambie el mes
  useEffect(() => {
    const loadPublicHours = async () => {
      try {
        const startDate = format(currentMonth, 'yyyy-MM-01');
        const endDate = format(addMonths(currentMonth, 1), 'yyyy-MM-01');
        const hours = await getPublicHoursForClient(startDate, endDate);
        setPublicHours(hours);
      } catch (error) {
        console.error('Error cargando horarios públicos:', error);
      }
    };

    loadPublicHours();
  }, [currentMonth]);

  // Calcular pasos
  const steps: BookingStep[] = useMemo(() => [
    {
      id: 'service',
      title: 'Seleccionar Servicio',
      description: 'Elige el servicio que necesitas',
      completed: !!selectedService
    },
    {
      id: 'date',
      title: 'Elegir Fecha',
      description: 'Selecciona el día que prefieres',
      completed: !!selectedDate
    },
    {
      id: 'time',
      title: 'Elegir Hora',
      description: 'Elige la hora disponible',
      completed: !!selectedTime
    },
    {
      id: 'confirm',
      title: 'Confirmar Cita',
      description: 'Revisa y confirma tu reserva',
      completed: false
    }
  ], [selectedService, selectedDate, selectedTime]);

  // Calcular horas bloqueadas para el día seleccionado
  const blockedHours = useMemo(() => {
    if (!selectedDate || !appointments || appointments.length === 0 || !selectedService) {
      return new Set<string>();
    }

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const serviceDuration = parseDuration(selectedService.duration || 60);
    const blocked = new Set<string>();

    // Filtrar citas del mismo día
    const sameDateAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return format(aptDate, 'yyyy-MM-dd') === selectedDateStr;
    });

    // Calcular horas bloqueadas
    sameDateAppointments.forEach(apt => {
      const aptStart = new Date(apt.date);
      const aptEnd = new Date(aptStart);
      
      let aptDuration = 60;
      if (apt.service?.duration) {
        aptDuration = parseDuration(apt.service.duration);
      }
      
      aptEnd.setMinutes(aptEnd.getMinutes() + aptDuration);

      // Bloquear cada intervalo de 30 minutos que se superponga
      for (let hour = aptStart.getHours(); hour <= aptEnd.getHours(); hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const intervalStart = new Date(selectedDate);
          intervalStart.setHours(hour, minute, 0, 0);
          
          const intervalEnd = new Date(intervalStart);
          intervalEnd.setMinutes(intervalEnd.getMinutes() + serviceDuration);
          
          if (intervalStart < aptEnd && intervalEnd > aptStart) {
            const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            blocked.add(timeKey);
          }
        }
      }
    });

    return blocked;
  }, [selectedDate, appointments, selectedService]);

  // Calcular horas válidas para el servicio seleccionado
  const validHours = useMemo(() => {
    if (!selectedDate || !selectedService) {
      return new Set<string>();
    }

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const availableHours = publicHours[selectedDateStr] || [];
    const serviceDuration = parseDuration(selectedService.duration || 60);
    const valid = new Set<string>();

    // Generar todas las horas posibles (6 AM - 11 PM)
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Verificar si está en horarios públicos disponibles
        if (!availableHours.includes(time)) {
          continue;
        }

        // Verificar si el servicio cabe desde esta hora
        const startTime = new Date(selectedDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + serviceDuration);
        
        // Verificar que termine antes de las 11 PM
        if (endTime.getHours() >= 23 || endTime.getDate() !== selectedDate.getDate()) {
          continue;
        }
        
        // Verificar conflictos con citas existentes
        let hasConflict = false;
        const currentTime = new Date(startTime);
        
        while (currentTime < endTime) {
          const currentHour = currentTime.getHours();
          const currentMinute = currentTime.getMinutes();
          const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          
          if (blockedHours.has(currentTimeStr)) {
            hasConflict = true;
            break;
          }
          
          currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        
        if (!hasConflict) {
          valid.add(time);
        }
      }
    }

    return valid;
  }, [selectedDate, selectedService, publicHours, blockedHours]);

  // Función para verificar si un día está completamente lleno
  const isDayCompletelyBooked = useCallback((date: Date, dateStr: string) => {
    if (!publicHours[dateStr] || publicHours[dateStr].length === 0) {
      return false; // No hay horas habilitadas, no está lleno
    }

    // Obtener todas las horas habilitadas para este día
    const availableHours = publicHours[dateStr];
    
    // Obtener citas de este día
    const dayAppointments = appointments.filter(apt => 
      isSameDay(new Date(apt.date), date)
    );

    // Para cada hora habilitada, verificar si está ocupada
    const bookedHours = new Set<string>();
    
    dayAppointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      const aptHour = `${aptDate.getHours().toString().padStart(2, '0')}:${aptDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Calcular duración del servicio
      const serviceDuration = apt.service?.duration || 60;
      const durationMinutes = parseDuration(serviceDuration);
      
      // Bloquear todas las horas que ocupa esta cita
      for (let i = 0; i < durationMinutes; i += 30) {
        const blockTime = new Date(aptDate.getTime() + i * 60000);
        const blockHour = `${blockTime.getHours().toString().padStart(2, '0')}:${blockTime.getMinutes().toString().padStart(2, '0')}`;
        bookedHours.add(blockHour);
      }
    });

    // Verificar si todas las horas habilitadas están ocupadas
    const allHoursBooked = availableHours.every(hour => bookedHours.has(hour));
    
    console.log(`🔍 Día ${dateStr}:`, {
      availableHours,
      bookedHours: Array.from(bookedHours),
      allHoursBooked
    });

    return allHoursBooked;
  }, [publicHours, appointments]);

  // Generar días del mes para el calendario
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });
    const endDate = addDays(startOfWeek(lastDay, { weekStartsOn: 1 }), 6);

    const days = [];
    let current = startDate;

    while (current <= endDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const isCurrentMonth = current.getMonth() === month;
      const isToday = isSameDay(current, new Date());
      // Comparar solo la fecha, no la hora, para evitar problemas de timezone
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const currentDateOnly = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      const isPast = currentDateOnly < todayDateOnly;
      const hasPublicHours = publicHours[dateStr] && publicHours[dateStr].length > 0;
      const isCompletelyBooked = isDayCompletelyBooked(current, dateStr);

      const isSelectable = isCurrentMonth && !isPast && hasPublicHours && !isCompletelyBooked && selectedService;
      
      // Debug para el día 2025-09-11
      if (dateStr === '2025-09-11') {
        console.log('🔍 DEBUG día 2025-09-11:', {
          isCurrentMonth,
          isPast,
          hasPublicHours,
          isCompletelyBooked,
          selectedService: !!selectedService,
          isSelectable,
          publicHoursForDay: publicHours[dateStr]
        });
      }
      
      days.push({
        date: current,
        dateStr,
        isCurrentMonth,
        isToday,
        isPast,
        hasPublicHours,
        isCompletelyBooked,
        isSelectable
      });

      current = addDays(current, 1);
    }

    return days;
  }, [currentMonth, publicHours, appointments, selectedService, isDayCompletelyBooked]);

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Manejar selección de día
  const handleDateSelect = (day: typeof calendarDays[0]) => {
    console.log('🔍 DEBUG handleDateSelect:', {
      dateStr: day.dateStr,
      isSelectable: day.isSelectable,
      hasPublicHours: day.hasPublicHours,
      selectedService: !!selectedService
    });
    
    if (!day.isSelectable) {
      console.log('❌ Día no seleccionable');
      return;
    }
    
    console.log('✅ Día seleccionado:', day.dateStr);
    setSelectedDate(day.date);
    setSelectedTime('');
    setCurrentStep('time');
  };

  // Manejar selección de hora
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('confirm');
  };

  // Manejar navegación entre pasos
  const handleStepClick = (stepId: 'service' | 'date' | 'time' | 'confirm') => {
    // Solo permitir navegación a pasos completados o al paso actual
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    if (stepIndex <= currentIndex || steps[stepIndex - 1]?.completed) {
      setCurrentStep(stepId);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientData.name || !clientData.phone) {
      console.log('❌ Validación fallida:', { selectedService, selectedDate, selectedTime, clientData });
      return;
    }

    try {
      console.log('🚀 Iniciando creación de cita...');
      setSubmitting(true);
      
      // Crear la fecha completa con la hora seleccionada
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Formatear la fecha para el backend (formato local sin UTC)
      const year = appointmentDate.getFullYear();
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getDate()).padStart(2, '0');
      const hoursStr = String(appointmentDate.getHours()).padStart(2, '0');
      const minutesStr = String(appointmentDate.getMinutes()).padStart(2, '0');
      const secondsStr = String(appointmentDate.getSeconds()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:${secondsStr}`;
      
      console.log('📅 Datos de la cita:', {
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email,
        date: formattedDate,
        serviceId: selectedService.id,
        serviceName: selectedService.name
      });
      console.log('📅 Fecha original:', appointmentDate);
      console.log('📅 Fecha formateada:', formattedDate);
      console.log('📅 Zona horaria del frontend:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      
      // Crear la cita usando el servicio real
      console.log('📡 Llamando a createPublicAppointment...');
      const newAppointment = await createPublicAppointment({
        clientName: clientData.name,
        clientEmail: clientData.email || undefined,
        clientPhone: clientData.phone,
        date: formattedDate,
        serviceId: selectedService.id,
        notes: `Cita creada desde landing page - ${selectedService.name}`
      });
      
      console.log('✅ Cita creada exitosamente:', newAppointment);
      
      // Mostrar animación de éxito
      console.log('🎉 Mostrando animación de éxito...');
      setSuccessClientName(clientData.name);
      setShowSuccessAnimation(true);
      
      // Resetear formulario después de un delay
      setTimeout(() => {
        setSelectedService(null);
    setSelectedDate(null);
        setSelectedTime('');
        setClientData({ name: '', phone: '', email: '' });
        setCurrentStep('service');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error reservando cita:', error);
      console.error('❌ Detalles del error:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : 'No disponible',
        name: error instanceof Error ? error.name : 'Error'
      });
      alert('Error al reservar la cita. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar cierre de la animación de éxito
  const handleSuccessClose = () => {
    setShowSuccessAnimation(false);
    setSuccessClientName('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">

              {/* Pasos de navegación */}
        <div className="bg-white rounded-xl shadow-sm border p-3 md:p-4">
          {/* Desktop: Pasos completos */}
          <div className="hidden md:flex items-center justify-between mb-6 overflow-x-auto p-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all hover:scale-105 ${
                    step.completed 
                      ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                      : currentStep === step.id
                      ? 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600'
                      : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {step.completed ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="font-bold text-base">{index + 1}</span>
                  )}
                </button>
                <div className="ml-3 min-w-0">
                  <h3 className={`font-bold text-xs ${
                    currentStep === step.id ? 'text-pink-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Mobile: Indicador ultra compacto */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">{steps.findIndex(s => s.id === currentStep) + 1}/4</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-pink-600 font-medium">
                  {steps.find(s => s.id === currentStep)?.title}
                </span>
              </div>
              <div className="flex gap-1">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      step.completed 
                        ? 'bg-green-500' 
                        : currentStep === step.id
                        ? 'bg-pink-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Navegación móvil */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1].id);
                  }
                }}
                disabled={steps.findIndex(s => s.id === currentStep) === 0}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-3 h-3" />
                Anterior
              </button>
              
              <div className="flex gap-1">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={!step.completed && index > steps.findIndex(s => s.id === currentStep)}
                    className={`w-6 h-6 rounded-full text-xs font-medium transition-all ${
                      step.completed 
                        ? 'bg-green-500 text-white hover:bg-green-600' 
                        : currentStep === step.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {step.completed ? '✓' : index + 1}
                  </button>
          ))}
        </div>

              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  if (currentIndex < steps.length - 1 && steps[currentIndex + 1]?.completed) {
                    setCurrentStep(steps[currentIndex + 1].id);
                  }
                }}
                disabled={!steps[steps.findIndex(s => s.id === currentStep) + 1]?.completed}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRightIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

              {/* Contenido del paso actual */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 lg:p-8">
        {/* Paso 1: Selección de Servicio */}
        {currentStep === 'service' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">¿Qué servicio necesitas?</h2>
              <p className="text-gray-600">Elige el servicio que deseas agendar</p>
            </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`relative group cursor-pointer transition-all duration-200 rounded-lg border p-3 ${
                      selectedService?.id === service.id
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md'
                        : 'bg-white hover:bg-pink-50 border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    {/* Check mark overlay */}
                    {selectedService?.id === service.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                    )}
                    
                    {/* Service content */}
                    <div className="space-y-2">
                      <div className="pr-8">
                        <h3 className={`font-medium text-sm ${
                          selectedService?.id === service.id ? 'text-white' : 'text-gray-900'
                        }`}>
                          {service.name}
                        </h3>
                        <p className={`text-xs mt-1 line-clamp-2 ${
                          selectedService?.id === service.id ? 'text-pink-100' : 'text-gray-600'
                        }`}>
                          {service.description || 'Sin descripción'}
                        </p>
        </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-base font-bold ${
                          selectedService?.id === service.id ? 'text-white' : 'text-pink-500'
                        }`}>
                          ${service.price}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          selectedService?.id === service.id 
                            ? 'bg-white bg-opacity-20 text-white' 
                            : 'bg-pink-100 text-pink-700'
                        }`}>
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
                </div>
              ))}
            </div>

            {selectedService && (
                            <div className="flex justify-center pt-4">
                <button
                  onClick={() => setCurrentStep('date')}
                  className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium text-sm shadow-sm"
                >
                  Continuar con la Fecha
                </button>
            </div>
            )}
          </div>
        )}

        {/* Paso 2: Selección de Fecha */}
        {currentStep === 'date' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">¿Cuándo prefieres venir?</h2>
              <p className="text-gray-600">Selecciona el día que mejor te convenga</p>
            </div>

            {/* Navegación del mes */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h3>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
      </div>

      {/* Calendario */}
            <div className="grid grid-cols-7 gap-1">
              {/* Días de la semana */}
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}

              {/* Días del mes */}
              {calendarDays.map((day, index) => {
                // Determinar el estado y color del día
                let dayClass = '';
                let backgroundColor = '';
                let textColor = '';
                let borderColor = '';
                
                if (!day.isCurrentMonth) {
                  // Días de otros meses
                  dayClass = 'text-gray-200 bg-gray-50 cursor-not-allowed';
                } else if (day.isPast) {
                  // Días pasados
                  dayClass = 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed';
                } else if (day.isCompletelyBooked) {
                  // Días completamente llenos - ROJO
                  dayClass = 'text-white bg-red-500 border-red-600 hover:bg-red-600 shadow-md';
                } else if (day.isToday && day.hasPublicHours) {
                  // Hoy y disponible - VERDE con indicador de "Hoy"
                  dayClass = 'text-white bg-green-500 border-green-600 hover:bg-green-600 shadow-md font-bold';
                } else if (day.hasPublicHours) {
                  // Días habilitados y disponibles - VERDE
                  dayClass = 'text-white bg-green-500 border-green-600 hover:bg-green-600 shadow-md';
                } else {
                  // Días no habilitados - GRIS
                  dayClass = 'text-gray-500 bg-gray-200 border-gray-300 cursor-not-allowed';
                }
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={`relative p-3 text-center cursor-pointer transition-all duration-200 rounded-lg border-2 ${dayClass} ${
                      day.isSelectable ? 'hover:scale-105 transform' : ''
                    }`}
                  >
                    <span className="text-sm font-medium">{format(day.date, 'd')}</span>
                    
                    {/* Indicador de "Hoy" */}
                    {day.isToday && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xs font-bold">H</span>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
        
        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 text-sm justify-center bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">Todas las horas ocupadas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded-lg shadow-sm"></div>
            <span className="text-gray-700 font-medium">No habilitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="text-gray-700 font-medium">Hoy</span>
          </div>
        </div>

            {selectedDate && (
              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentStep('time')}
                  className="px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
                >
                  Continuar con la Hora
                </button>
              </div>
            )}
      </div>
        )}

        {/* Paso 3: Selección de Hora */}
        {currentStep === 'time' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">¿A qué hora prefieres?</h2>
              <p className="text-gray-600">
                {selectedDate && `Horarios disponibles para el ${format(selectedDate, 'dd/MM/yyyy')}`}
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-4 border border-gray-200 rounded-lg bg-white">
              {Array.from({ length: 34 }, (_, i) => {
                const hour = Math.floor(i / 2) + 6;
                const minute = (i % 2) * 30;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                const isSelected = selectedTime === time;
                const isTimeValid = validHours.has(time);
                const isBlocked = blockedHours.has(time);
                
                let buttonClass = '';
                if (isTimeValid) {
                  buttonClass = isSelected
                    ? 'bg-green-500 text-white border-green-500 shadow-md'
                    : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400';
                } else if (isBlocked) {
                  buttonClass = 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed opacity-75';
                } else {
                  buttonClass = 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50';
                }
                
                return (
                  <button
                    key={time}
                    onClick={() => {
                      if (isTimeValid) {
                        handleTimeSelect(time);
                      }
                    }}
                    disabled={!isTimeValid}
                    className={`w-full h-12 px-2 py-1 text-xs font-medium rounded border transition-all duration-200 hover:scale-105 flex flex-col items-center justify-center ${buttonClass}`}
                  >
                    <span className="font-bold">{time}</span>
                    {isTimeValid && selectedService && (
                      <span className="text-xs opacity-75">
                        {(() => {
                          const duration = parseDuration(selectedService.duration || 60);
                          const endHour = hour + Math.floor((minute + duration) / 60);
                          const endMinute = (minute + duration) % 60;
                          return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
                        })()}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Guía de colores */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <h3 className="font-semibold text-gray-900 mb-2 text-center text-sm">Guía de colores:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded shadow-sm"></div>
                  <span className="text-gray-700">Disponible - Puedes reservar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded shadow-sm"></div>
                  <span className="text-gray-700">Ocupado - Ya hay una cita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded shadow-sm"></div>
                  <span className="text-gray-700">No habilitado - Horario cerrado</span>
                </div>
              </div>
            </div>

            {selectedTime && (
              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentStep('confirm')}
                  className="px-8 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold"
                >
                  Continuar con la Confirmación
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paso 4: Confirmación */}
        {currentStep === 'confirm' && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">Confirma tu Cita</h2>
              <p className="text-gray-600">Revisa los detalles y completa tus datos</p>
            </div>

            {/* Resumen de la cita */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 space-y-6 shadow-sm border border-pink-200">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                Resumen de tu Cita
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-pink-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <CalendarIcon className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Servicio</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{selectedService?.name}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-pink-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <CalendarIcon className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Fecha</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">
                    {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-pink-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Hora de Inicio</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">{selectedTime}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-pink-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="w-3 h-3 text-pink-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Duración</span>
                  </div>
                  <p className="font-bold text-gray-900 text-base">
                    {selectedService?.duration ? (() => {
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
                      return 'Duración no definida';
                    })() : 'Duración no definida'}
                  </p>
                  {selectedTime && selectedService?.duration && (
                    <p className="text-xs text-gray-600 mt-1">
                      Sale a las {(() => {
                        const durationInMinutes = parseDuration(selectedService.duration);
                        const [startHour, startMinute] = selectedTime.split(':').map(Number);
                        const endMinutes = startMinute + durationInMinutes;
                        const endHour = startHour + Math.floor(endMinutes / 60);
                        const finalMinutes = endMinutes % 60;
                        return `${endHour.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Formulario de datos del cliente */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                Tus Datos
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientData.name}
                    onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Tu nombre completo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={clientData.phone}
                    onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+593 99 123 4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setCurrentStep('time')}
                className="px-8 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={!clientData.name || !clientData.phone || submitting}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Reservando...
                  </>
                ) : (
                  'Confirmar Cita'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animación de éxito */}
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        onClose={handleSuccessClose}
        clientName={successClientName}
      />
    </div>
  );
}
