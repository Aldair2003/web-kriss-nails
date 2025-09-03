'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  formatAppointmentForCalendar,
  type Appointment,
  getAvailableAppointmentSlots,
  getAvailableDates
} from '@/services/appointment-service';
import { useAppointments } from '@/contexts/AppointmentContext';
import { AppointmentModal } from './AppointmentModal';
import { NewAppointmentModal } from './NewAppointmentModal';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';
import { PlusIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/toast';

interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  resource: Appointment;
  backgroundColor: string;
  borderColor: string;
  allDay?: boolean;
}

export function AdminCalendarFullCalendar() {
  const { appointments, loading, refreshAppointments } = useAppointments();
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [view, setView] = useState<string>('timeGridWeek');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successClientName, setSuccessClientName] = useState('');

    // Formatear citas para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    console.log('🔍 DEBUG Calendar - appointments recibidas:', appointments);
    console.log('🔍 DEBUG Calendar - cantidad de citas:', appointments?.length || 0);
    
    if (!appointments || appointments.length === 0) {
      console.log('🔍 DEBUG Calendar - No hay citas para mostrar');
      return [];
    }
    
    try {
      const formatted = appointments.map((appointment) => {
        try {
          console.log('🔍 DEBUG Calendar - Procesando cita:', appointment);
          const formattedEvent = formatAppointmentForCalendar(appointment);
          
          // ✅ Usar fechas UTC con timeZone: 'local' para correcta visualización
          const startISO = formattedEvent.start.toISOString();
          const endISO = formattedEvent.end.toISOString();
          
          console.log('🔍 DEBUG Calendar - Evento formateado:', {
            id: formattedEvent.id,
            title: formattedEvent.title,
            start: startISO,
            end: endISO
          });
          
          return {
            ...formattedEvent,
            start: startISO,
            end: endISO,
            allDay: false
          };
        } catch (error) {
          console.error('Error formateando cita:', error);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      console.log('🔍 DEBUG Calendar - Eventos finales para FullCalendar:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error general en formateo de citas:', error);
      return [];
    }
  }, [appointments]);

  // Manejar click en cita existente
  const handleEventClick = useCallback((info: any) => {
    setSelectedAppointment(info.event.extendedProps.resource);
  }, []);

  // Manejar click en slot vacío (crear nueva cita)
  const handleDateSelect = useCallback(async (selectInfo: any) => {
    let startTime = new Date(selectInfo.start);
    let endTime = new Date(selectInfo.end);
    
    // Si es selección de día completo, usar horario por defecto
    if (selectInfo.allDay) {
      startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 9, 0, 0);
      endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 10, 0, 0);
    }
    
    // Asegurar que esté en horario de trabajo (6 AM - 11 PM)
    const hour = startTime.getHours();
    if (hour < 6) {
      startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 9, 0, 0);
      endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 10, 0, 0);
    } else if (hour > 23) {
      startTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 9, 0, 0);
      endTime = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), 10, 0, 0);
    }

    // Verificar si el día está habilitado
    const selectedDate = startTime.toISOString().split('T')[0];
    
    if (!availableDates.includes(selectedDate)) {
      toast({
        title: '📅 Día no disponible',
        description: `El ${format(startTime, 'dd MMM yyyy', { locale: es })} no está habilitado para citas. Selecciona un día habilitado en el calendario.`,
        variant: 'pink',
        duration: 6000
      });
      return;
    }

    setSelectedSlot({ start: startTime, end: endTime });
    setShowNewAppointment(true);
  }, [availableDates]);

  // Función para crear nueva cita desde el botón
  const handleCreateNewAppointment = () => {
    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    
    setSelectedSlot({ start: startTime, end: endTime });
    setShowNewAppointment(true);
  };

  // Cargar fechas disponibles al montar el componente
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        setLoadingDates(true);
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const dates = await getAvailableDates(currentMonth, currentYear);
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error al cargar fechas disponibles:', error);
        toast({
          title: '⚠️ Error',
          description: 'No se pudieron cargar las fechas disponibles. Intenta recargar la página.',
          variant: 'destructive',
          duration: 5000
        });
      } finally {
        setLoadingDates(false);
      }
    };

    loadAvailableDates();
  }, [toast]);

  // Efecto para agregar líneas verticales manualmente - RESPONSIVE
  useEffect(() => {
    let isInitialized = false;
    
    const addVerticalLines = () => {
      const calendarContainer = document.querySelector('.admin-calendar-fullcalendar-container .fc-timegrid');
      if (calendarContainer) {
        // Verificar que no estemos en un modal
        const modal = document.querySelector('[role="dialog"], .modal, .fixed.inset-0, .bg-black\\/50, .fixed.inset-0.z-50, .fixed.inset-0.bg-black\\/30, .fixed.inset-0.bg-black\\/80');
        if (modal) {
          return; // No agregar líneas si hay un modal abierto
        }
        
        // Verificar que el contenedor del calendario no esté dentro de un modal
        let parent = calendarContainer.parentElement;
        while (parent) {
          if (parent.classList.contains('fixed') && parent.classList.contains('inset-0')) {
            return; // No agregar líneas si el calendario está dentro de un modal
          }
          parent = parent.parentElement;
        }
        
        // Verificar que el calendario esté visible
        const calendarRect = calendarContainer.getBoundingClientRect();
        if (calendarRect.width === 0 || calendarRect.height === 0) {
          return; // No agregar líneas si el calendario no está visible
        }
        // Remover líneas existentes
        const existingLines = calendarContainer.querySelectorAll('.vertical-line');
        existingLines.forEach(line => line.remove());

        // Obtener los headers de días para posicionamiento exacto
        const headerCells = document.querySelectorAll('.admin-calendar-fullcalendar-container .fc-col-header-cell');
        const dayColumns = calendarContainer.querySelectorAll('.fc-timegrid-col');
        
        // Verificar que el calendario esté completamente renderizado
        if (headerCells.length < 7 || dayColumns.length < 7) {
          // Si no hay 7 headers o columnas, el calendario no está completamente renderizado
          return;
        }
        
        if (headerCells.length >= 7 && dayColumns.length >= 7) {
                      // Verificar si las líneas ya están en la posición correcta
            const existingLines = calendarContainer.querySelectorAll('.vertical-line');
            if (existingLines.length === 7 && isInitialized) {
              // Verificar si las posiciones actuales son correctas
              let positionsCorrect = true;
              existingLines.forEach((line, index) => {
                const currentLeft = parseFloat((line as HTMLElement).style.left);
                const headerCell = headerCells[index];
                const headerRect = headerCell.getBoundingClientRect();
                const containerRect = calendarContainer.getBoundingClientRect();
                const expectedLeft = ((headerRect.right - containerRect.left) / containerRect.width) * 100;
                
                if (Math.abs(currentLeft - expectedLeft) > 0.5) {
                  positionsCorrect = false;
                }
              });
              
              if (positionsCorrect) {
                return; // No reajustar si las posiciones están correctas
              }
            }
          
          // POSICIONES BASADAS EN LOS HEADERS DE DÍAS
          const linePositions = [
            { id: 1, headerIndex: 0, description: 'Domingo-Lunes' },
            { id: 2, headerIndex: 1, description: 'Lunes-Martes' },
            { id: 3, headerIndex: 2, description: 'Martes-Miércoles' },
            { id: 4, headerIndex: 3, description: 'Miércoles-Jueves' },
            { id: 5, headerIndex: 4, description: 'Jueves-Viernes' },
            { id: 6, headerIndex: 5, description: 'Viernes-Sábado' },
            { id: 7, headerIndex: 6, description: 'Sábado-Fin' }
          ];

          // Agregar líneas verticales alineadas con headers
          linePositions.forEach(({ id, headerIndex, description }) => {
            const line = document.createElement('div');
            line.className = `vertical-line vertical-line-${id} ${window.innerWidth <= 768 ? 'vertical-line-mobile' : 'vertical-line-desktop'}`;
            line.setAttribute('data-line-id', id.toString());
            line.setAttribute('data-description', description);
            line.setAttribute('data-header-index', headerIndex.toString());
            
            // Calcular posición basada en el header del día
            const headerCell = headerCells[headerIndex];
            const headerRect = headerCell.getBoundingClientRect();
            const containerRect = calendarContainer.getBoundingClientRect();
            
            // Mejorar cálculo de posición para móviles
            let relativeLeft;
            if (window.innerWidth <= 768) {
              // En móviles, usar posición relativa al contenedor de scroll
              const scrollContainer = calendarContainer.closest('.fc-view-harness');
              if (scrollContainer) {
                const scrollRect = scrollContainer.getBoundingClientRect();
                relativeLeft = ((headerRect.right - scrollRect.left) / scrollRect.width) * 100;
              } else {
                relativeLeft = ((headerRect.right - containerRect.left) / containerRect.width) * 100;
              }
            } else {
              relativeLeft = ((headerRect.right - containerRect.left) / containerRect.width) * 100;
            }
            
            line.style.cssText = `
              position: absolute;
              top: 0;
              left: ${relativeLeft}%;
              width: ${window.innerWidth <= 768 ? '1px' : '2px'};
              height: 100%;
              background-color: ${window.innerWidth <= 768 ? '#e5e7eb' : '#d1d5db'};
              z-index: ${window.innerWidth <= 768 ? '20' : '15'};
              pointer-events: none;
              transform: translateX(-50%);
              opacity: ${window.innerWidth <= 768 ? '0.6' : '1'};
              box-shadow: ${window.innerWidth <= 768 ? 'none' : '0 0 2px rgba(0,0,0,0.1)'};
              --original-left: ${relativeLeft}%;
            `;
            
            // Agregar atributo de posición después del cálculo
            line.setAttribute('data-position', relativeLeft.toFixed(2));
            
            calendarContainer.appendChild(line);
          });
          
          isInitialized = true;
        }
      }
    };

    // Ejecutar después de que el calendario se renderice
    const timer = setTimeout(addVerticalLines, 500);
    
    // Ejecutar múltiples veces para asegurar posicionamiento correcto
    const timer2 = setTimeout(addVerticalLines, 1000);
    const timer3 = setTimeout(addVerticalLines, 1500);
    const timer4 = setTimeout(addVerticalLines, 2000);
    const timer5 = setTimeout(addVerticalLines, 3000);
    
    // Ejecutar después de que se complete el scroll
    const timer6 = setTimeout(addVerticalLines, 4000);
    
    // Agregar listener para redimensionamiento
    const handleResize = () => {
      setTimeout(addVerticalLines, 200);
    };

    // Agregar listener para scroll
    const handleScroll = () => {
      setTimeout(addVerticalLines, 100);
    };
    
    // Observer para detectar cambios en el calendario
    const calendarObserver = new MutationObserver(() => {
      setTimeout(addVerticalLines, 200);
    });
    
    // Observar cambios en el contenedor del calendario
    const calendarContainer = document.querySelector('.admin-calendar-fullcalendar-container .fc-timegrid');
    if (calendarContainer) {
      calendarObserver.observe(calendarContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    // Listener para cambios de vista del calendario
    const handleViewChange = () => {
      setTimeout(addVerticalLines, 300);
    };
    
    // Agregar listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Agregar listener para scroll del calendario
    const scrollContainer = document.querySelector('.admin-calendar-fullcalendar-container .fc-view-harness');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    // Observer para cambios en el DOM del calendario
    const fullCalendarObserver = new MutationObserver((mutations) => {
      // Verificar si se agregó un modal
      const hasModalAdded = mutations.some(mutation => 
        mutation.type === 'childList' && 
        mutation.addedNodes.length > 0 &&
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && 
          (node as Element).classList?.contains('fixed') &&
          (node as Element).classList?.contains('inset-0') &&
          ((node as Element).classList?.contains('z-50') || 
           (node as Element).classList?.contains('bg-black/30') ||
           (node as Element).classList?.contains('bg-black/50') ||
           (node as Element).classList?.contains('bg-black/80'))
        )
      );
      
      if (hasModalAdded) {
        // Limpiar líneas si se abrió un modal
        const calendarContainer = document.querySelector('.admin-calendar-fullcalendar-container .fc-timegrid');
        if (calendarContainer) {
          const existingLines = calendarContainer.querySelectorAll('.vertical-line');
          existingLines.forEach(line => line.remove());
        }
        return;
      }
      
      // Verificar si se removió un modal
      const hasModalRemoved = mutations.some(mutation => 
        mutation.type === 'childList' && 
        mutation.removedNodes.length > 0 &&
        Array.from(mutation.removedNodes).some(node => 
          node.nodeType === 1 && 
          (node as Element).classList?.contains('fixed') &&
          (node as Element).classList?.contains('inset-0') &&
          ((node as Element).classList?.contains('z-50') || 
           (node as Element).classList?.contains('bg-black/30') ||
           (node as Element).classList?.contains('bg-black/50') ||
           (node as Element).classList?.contains('bg-black/80'))
        )
      );
      
      if (hasModalRemoved) {
        // Restaurar líneas si se cerró un modal
        setTimeout(addVerticalLines, 300);
        return;
      }
      
      setTimeout(addVerticalLines, 150);
    });
    
    const fullCalendarContainer = document.querySelector('.admin-calendar-fullcalendar-container');
    if (fullCalendarContainer) {
      fullCalendarObserver.observe(fullCalendarContainer, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      calendarObserver.disconnect();
      fullCalendarObserver.disconnect();
    };
  }, [calendarEvents]);

  // Efecto para forzar el re-renderizado del calendario
  useEffect(() => {
    const forceCalendarResize = () => {
      const calendar = document.querySelector('.admin-calendar-fullcalendar-container .fc');
      if (calendar) {
        // Forzar un resize del calendario
        window.dispatchEvent(new Event('resize'));
        
        // También podemos usar el API de FullCalendar si está disponible
        const fullCalendarInstance = (calendar as any).fullCalendar;
        if (fullCalendarInstance && typeof fullCalendarInstance.updateSize === 'function') {
          fullCalendarInstance.updateSize();
        }
      }
    };

    // Ejecutar después de que el componente se monte
    const timer = setTimeout(forceCalendarResize, 100);
    const timer2 = setTimeout(forceCalendarResize, 500);
    const timer3 = setTimeout(forceCalendarResize, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando calendario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border border-pink-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-pink-500 rounded-xl shadow-lg">
              <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Calendario de Citas
              </h2>
              <p className="text-sm sm:text-base text-gray-700">
                Gestiona y programa las citas de Rachell
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600" />
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    Horario: 6:00 AM - 11:00 PM
                  </span>
                </div>
                {!loadingDates && (
                  <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    {availableDates.length} días habilitados
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleCreateNewAppointment}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
          >
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Nueva Cita Manual
          </button>
        </div>
      </div>

      {/* Calendario FullCalendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm admin-calendar-fullcalendar-container overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          // Configuración responsive para móviles
          views={{
            timeGridWeek: {
              titleFormat: { weekday: 'long', day: 'numeric', month: 'long' }
            },
            timeGridDay: {
              titleFormat: { weekday: 'long', day: 'numeric', month: 'long' }
            }
          }}
          locale="es"
          timeZone="local"
          slotMinTime="06:00:00"
          slotMaxTime="23:30:00"
          slotDuration="00:30:00"
          slotLabelInterval="00:30:00"
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          allDaySlot={false}
          height="auto"
          aspectRatio={1.8}
          expandRows={true}
          // Configuración para scroll táctil en móviles
          scrollTime="08:00:00"
          scrollTimeReset={false}
          // Configuración responsive
          contentHeight="auto"
          events={calendarEvents}
          eventClick={handleEventClick}
          selectable={true}
          select={handleDateSelect}
          selectConstraint={{
            startTime: '06:00:00',
            endTime: '23:30:00'
          }}
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayHeaderFormat={{
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            list: 'Lista'
          }}
                     titleFormat={{
             month: 'long',
             week: 'long',
             day: 'numeric'
           }}
          eventClassNames={(arg) => {
            const event = arg.event;
            const resource = event.extendedProps.resource as Appointment;
            const status = resource?.status;
            
            let statusClass = '';
            switch (status) {
              case 'CONFIRMED':
                statusClass = 'fc-event-confirmed';
                break;
              case 'PENDING':
                statusClass = 'fc-event-pending';
                break;
              case 'CANCELLED':
                statusClass = 'fc-event-cancelled';
                break;
              default:
                statusClass = 'fc-event-pending';
            }
            
            return [statusClass];
          }}
                     eventContent={(arg) => {
             const event = arg.event;
             const resource = event.extendedProps.resource as Appointment;
             
             // Verificar que start y end no sean null
             if (!event.start || !event.end) {
               return (
                 <div className="fc-event-content">
                   <div className="fc-event-title">{event.title}</div>
                 </div>
               );
             }
             
             // Convertir a Date si es string
             const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start;
             const endDate = typeof event.end === 'string' ? new Date(event.end) : event.end;
             
             const duration = endDate.getTime() - startDate.getTime();
             const durationHours = Math.round(duration / (1000 * 60 * 60) * 10) / 10; // Redondear a 1 decimal
             
             // Separar cliente y servicio del título
             const titleParts = event.title.split(' - ');
             const clientName = titleParts[0] || event.title;
             const serviceName = titleParts[1] || '';
             
             return (
               <div className="fc-event-content">
                 <div className="fc-event-client">{clientName}</div>
                 {serviceName && <div className="fc-event-service">{serviceName}</div>}
                 <div className="fc-event-time">
                   {startDate.toLocaleTimeString('es-EC', { 
                     hour: '2-digit', 
                     minute: '2-digit',
                     hour12: false 
                   })} - {endDate.toLocaleTimeString('es-EC', { 
                     hour: '2-digit', 
                     minute: '2-digit',
                     hour12: false 
                   })}
                 </div>
                 <div className="fc-event-duration">
                   {durationHours}h
                 </div>
               </div>
             );
           }}
        />
        
        {/* Leyenda mejorada */}
        {!loadingDates && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl border border-pink-100">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-pink-500 rounded-full"></div>
              Leyenda del Calendario
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded border-2 border-green-700 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Confirmadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded border-2 border-yellow-700 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Pendientes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded border-2 border-red-700 shadow-sm"></div>
                <span className="text-gray-700 font-medium">Canceladas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-100 rounded border-2 border-pink-300"></div>
                <span className="text-gray-700 font-medium">Días habilitados</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de cita existente */}
      <AppointmentModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={() => {}}
      />

      {/* Modal de nueva cita */}
      <NewAppointmentModal
        open={showNewAppointment}
        slot={selectedSlot}
        onClose={() => {
          setShowNewAppointment(false);
          setSelectedSlot(null);
        }}
        onCreate={async (clientName: string) => {
          console.log('🔍 DEBUG Calendar - onCreate llamado con nombre:', clientName);
          // ✅ Recargar citas después de crear una nueva
          await refreshAppointments();
          console.log('🔍 DEBUG Calendar - Citas recargadas');
          
          // ✅ Mostrar animación de éxito
          setSuccessClientName(clientName);
          setShowSuccessAnimation(true);
        }}
      />

      {/* Animación de éxito */}
      <SuccessAnimation
        isVisible={showSuccessAnimation}
        onClose={() => {
          setShowSuccessAnimation(false);
        }}
        clientName={successClientName}
      />

      {/* Estilos CSS personalizados para FullCalendar */}
      <style jsx global>{`
        /* RESET Y BASE - Limpiar estilos por defecto */
        .admin-calendar-fullcalendar-container .fc {
          font-family: inherit;
          font-size: 14px;
          border-radius: 16px;
          overflow: hidden;
        }

        /* HEADER DEL CALENDARIO */
        .admin-calendar-fullcalendar-container .fc-header-toolbar {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          padding: 20px 24px;
          border-radius: 16px 16px 0 0;
          margin: 0;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }

        .admin-calendar-fullcalendar-container .fc-toolbar-title {
          color: white !important;
          font-weight: 800 !important;
          font-size: 22px !important;
          text-transform: none !important;
          letter-spacing: 0.5px !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .admin-calendar-fullcalendar-container .fc-button {
          background: rgba(255, 255, 255, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          transition: all 0.2s ease !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          font-size: 12px !important;
        }

        .admin-calendar-fullcalendar-container .fc-button:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        .admin-calendar-fullcalendar-container .fc-button:active {
          background: rgba(255, 255, 255, 0.4) !important;
          transform: translateY(0) !important;
        }

        .admin-calendar-fullcalendar-container .fc-button-primary {
          background: rgba(255, 255, 255, 0.25) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
        }

        /* HEADERS DE DÍAS */
        .admin-calendar-fullcalendar-container .fc-col-header-cell {
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%) !important;
          border: 2px solid #d1d5db !important;
          border-bottom: 2px solid #d1d5db !important;
          padding: 16px 8px !important;
          text-align: center !important;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1);
        }

        .admin-calendar-fullcalendar-container .fc-col-header-cell:not(:last-child) {
          border-right: 2px solid #d1d5db !important;
        }

        .admin-calendar-fullcalendar-container .fc-col-header-cell-cushion {
          color: #831843 !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          text-transform: none !important;
          letter-spacing: 0.5px !important;
          text-decoration: none !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        /* EVENTOS */
        .admin-calendar-fullcalendar-container .fc-event {
          border-radius: 12px !important;
          border: 2px solid !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          margin: 2px 3px !important;
          font-weight: 600 !important;
          font-size: 12px !important;
          padding: 6px 10px !important;
          min-height: 28px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          transition: all 0.3s ease !important;
          backdrop-filter: blur(4px) !important;
        }

        .admin-calendar-fullcalendar-container .fc-event:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
          z-index: 10 !important;
        }

        /* COLORES DE EVENTOS POR ESTADO - OPTIMIZADOS */
        .admin-calendar-fullcalendar-container .fc-event-confirmed {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border: 1px solid #047857 !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-confirmed:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35) !important;
          cursor: pointer !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-pending {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
          border: 1px solid #b45309 !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-pending:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35) !important;
          cursor: pointer !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-cancelled {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          border: 1px solid #b91c1c !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-cancelled:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35) !important;
          cursor: pointer !important;
        }

        /* CONTENIDO DE EVENTOS - OPTIMIZADO Y RESPONSIVE */
        .admin-calendar-fullcalendar-container .fc-event-content {
          width: 100% !important;
          text-align: center !important;
          padding: 3px 4px !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          min-height: 100% !important;
          gap: 1px !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-client {
          font-weight: 700 !important;
          font-size: 12px !important;
          line-height: 1.1 !important;
          margin-bottom: 1px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
          letter-spacing: 0.2px !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-service {
          font-weight: 600 !important;
          font-size: 10px !important;
          line-height: 1.1 !important;
          margin-bottom: 1px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
          opacity: 0.9 !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-time {
          font-size: 10px !important;
          opacity: 0.95 !important;
          font-weight: 600 !important;
          margin-bottom: 1px !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
        }

        .admin-calendar-fullcalendar-container .fc-event-duration {
          font-size: 9px !important;
          opacity: 0.9 !important;
          font-weight: 600 !important;
          background: rgba(255, 255, 255, 0.3) !important;
          padding: 1px 4px !important;
          border-radius: 4px !important;
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15) !important;
        }

        /* RESPONSIVE PARA EVENTOS */
        @media (max-width: 1200px) {
          .admin-calendar-fullcalendar-container .fc-event-client {
            font-size: 11px !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-service {
            font-size: 9px !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-time {
            font-size: 9px !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-duration {
            font-size: 8px !important;
          }
        }

        @media (max-width: 768px) {
          .admin-calendar-fullcalendar-container .fc-event-content {
            padding: 2px 3px !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-client {
            font-size: 10px !important;
            line-height: 1.0 !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-service {
            font-size: 8px !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-time {
            font-size: 8px !important;
          }
          .admin-calendar-fullcalendar-container .fc-event-duration {
            font-size: 7px !important;
            padding: 1px 3px !important;
          }
        }

        /* SLOTS DE TIEMPO */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot {
          border-bottom: 2px solid #d1d5db !important;
          background: #ffffff !important;
          min-height: 40px !important;
        }

        /* BORDES VERTICALES DE DÍAS */
        .admin-calendar-fullcalendar-container .fc-timegrid-col {
          border-right: 2px solid #d1d5db !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-col:last-child {
          border-right: none !important;
        }

        /* BORDES DE LA CUADRÍCULA PRINCIPAL */
        .admin-calendar-fullcalendar-container .fc-timegrid {
          border: 2px solid #d1d5db !important;
          border-radius: 8px !important;
        }

        /* NUEVA ESTRATEGIA PARA BORDES INTERNOS VERTICALES */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
          border-right: 2px solid #d1d5db !important;
          position: relative !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:last-child {
          border-right: none !important;
        }

        /* BORDES USANDO ESTRUCTURA INTERNA DE FULLCALENDAR */
        .admin-calendar-fullcalendar-container .fc-timegrid .fc-timegrid-slots td {
          border-right: 2px solid #d1d5db !important;
          border-bottom: 2px solid #d1d5db !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid .fc-timegrid-slots td:last-child {
          border-right: none !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid .fc-timegrid-slots tr:last-child td {
          border-bottom: none !important;
        }

        /* BORDES EN EL CONTENIDO DE EVENTOS */
        .admin-calendar-fullcalendar-container .fc-timegrid .fc-timegrid-event-harness {
          border-right: 2px solid #d1d5db !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid .fc-timegrid-event-harness:last-child {
          border-right: none !important;
        }

        /* ESTRATEGIA CON BOX-SHADOW PARA BORDES */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:not(:last-child)::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          width: 2px !important;
          height: 100% !important;
          background-color: #d1d5db !important;
          z-index: 5 !important;
        }

        /* FORZAR BORDES CON !important Y SELECTORES MÁS ESPECÍFICOS */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
          border-right: 2px solid #d1d5db !important;
          border-right-width: 2px !important;
          border-right-style: solid !important;
          border-right-color: #d1d5db !important;
        }

        /* ESTRATEGIA ALTERNATIVA: USAR BOX-SHADOW PARA BORDES */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:not(:last-child) {
          box-shadow: inset -2px 0 0 #d1d5db !important;
        }

        /* ESTRATEGIA CON BACKGROUND GRADIENT */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
          background-image: linear-gradient(to right, transparent calc(100% - 2px), #d1d5db calc(100% - 2px)) !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:last-child {
          background-image: none !important;
        }

        /* ESTRATEGIA CON BORDER-IMAGE */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:not(:last-child) {
          border-image: linear-gradient(to bottom, transparent 0%, #d1d5db 0%, #d1d5db 100%, transparent 100%) 1 !important;
          border-right-width: 2px !important;
        }

        /* ESTRATEGIA NUCLEAR: FORZAR BORDES CON CSS MÁS AGRESIVO */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
          position: relative !important;
          border-right: 3px solid #9ca3af !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:last-child {
          border-right: none !important;
        }

        /* BORDES VERTICALES USANDO ELEMENTOS ABSOLUTOS */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:not(:last-child)::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          width: 3px !important;
          height: 100% !important;
          background-color: #9ca3af !important;
          z-index: 100 !important;
          pointer-events: none !important;
        }

        /* BORDES VERTICALES MÁS GRUESOS Y VISIBLES */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
          position: relative !important;
          border-right: 4px solid #6b7280 !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:last-child {
          border-right: none !important;
        }

        /* LÍNEAS VERTICALES CON PSEUDO-ELEMENTOS MÁS GRUESOS */
        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane:not(:last-child)::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          width: 4px !important;
          height: 100% !important;
          background-color: #6b7280 !important;
          z-index: 200 !important;
          pointer-events: none !important;
        }

        /* LIMPIAR BORDES VERTICALES CSS - SOLO USAR JAVASCRIPT */
        .admin-calendar-fullcalendar-container .fc-timegrid td {
          border-right: none !important;
        }

        .admin-calendar-fullcalendar-container .fc-col-header-cell {
          border-right: none !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
          border-right: none !important;
        }

        /* ESTILOS BASE PARA LÍNEAS VERTICALES */
        .admin-calendar-fullcalendar-container .vertical-line {
          position: absolute !important;
          top: 0 !important;
          width: 2px !important;
          height: 100% !important;
          background-color: #d1d5db !important;
          z-index: 15 !important;
          pointer-events: none !important;
          transform: translateX(-50%) !important;
          transition: left 0.3s ease !important;
          border-radius: 1px !important;
        }

        /* RESPONSIVE BREAKPOINTS PARA LÍNEAS */
        @media (max-width: 1200px) {
          .admin-calendar-fullcalendar-container .vertical-line {
            width: 1px !important;
          }
        }

        @media (max-width: 768px) {
          .admin-calendar-fullcalendar-container .vertical-line {
            width: 1px !important;
            background-color: #e5e7eb !important;
            opacity: 0.6 !important;
            z-index: 20 !important;
          }
        }

        /* ESTILO ESPECÍFICO PARA LA LÍNEA 7 (SÁBADO-FIN) */
        .admin-calendar-fullcalendar-container .vertical-line-7 {
          opacity: 0.7 !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-slot-label {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          padding: 8px 12px !important;
          border-right: 2px solid #be185d !important;
        }

        /* CONTROL DE ANCHO DEL CALENDARIO */
        .admin-calendar-fullcalendar-container .fc {
          width: 100% !important;
          max-width: 100% !important;
          touch-action: pan-x pan-y !important;
        }

        /* MEJORAR EXPERIENCIA TÁCTIL */
        .admin-calendar-fullcalendar-container .fc-view-harness {
          touch-action: pan-x pan-y !important;
          -webkit-overflow-scrolling: touch !important;
          scroll-behavior: smooth !important;
        }

        /* HABILITAR SCROLL TÁCTIL EN MÓVILES */
        @media (max-width: 768px) {
          .admin-calendar-fullcalendar-container {
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            position: relative !important;
          }
          
          .admin-calendar-fullcalendar-container .fc-view-harness {
            overflow-x: auto !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          /* INDICADORES DE SCROLL */
          .admin-calendar-fullcalendar-container::after {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            width: 20px !important;
            height: 100% !important;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.8)) !important;
            pointer-events: none !important;
            z-index: 5 !important;
          }

          .admin-calendar-fullcalendar-container::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 20px !important;
            height: 100% !important;
            background: linear-gradient(to left, transparent, rgba(255,255,255,0.8)) !important;
            pointer-events: none !important;
            z-index: 5 !important;
          }
        }

        .admin-calendar-fullcalendar-container .fc-view-harness {
          width: 100% !important;
          max-width: 100% !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
        }

        .admin-calendar-fullcalendar-container .fc-timegrid-col {
          width: calc(100% / 7) !important;
          min-width: calc(100% / 7) !important;
          max-width: calc(100% / 7) !important;
        }

        /* RESPONSIVE PARA MÓVILES */
        @media (max-width: 768px) {
          /* HEADER RESPONSIVE */
          .admin-calendar-fullcalendar-container .fc-header-toolbar {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 12px 16px !important;
          }

          .admin-calendar-fullcalendar-container .fc-toolbar-title {
            font-size: 16px !important;
          }

          .admin-calendar-fullcalendar-container .fc-button {
            padding: 8px 16px !important;
            font-size: 12px !important;
            min-height: 44px !important; /* Tamaño táctil mínimo */
          }

          /* EVENTOS RESPONSIVE */
          .admin-calendar-fullcalendar-container .fc-event {
            font-size: 9px !important;
            padding: 2px 4px !important;
            min-height: 20px !important;
            border-radius: 6px !important;
            margin: 1px 1px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          /* MEJORAR VISIBILIDAD DE EVENTOS EN MÓVIL */
          .admin-calendar-fullcalendar-container .fc-event-confirmed {
            background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-pending {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-cancelled {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
          }

          /* CONTENIDO DE EVENTOS RESPONSIVE */
          .admin-calendar-fullcalendar-container .fc-event-content {
            padding: 1px 2px !important;
            gap: 0px !important;
            justify-content: center !important;
            align-items: center !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-client {
            font-size: 9px !important;
            line-height: 1.0 !important;
            margin-bottom: 0px !important;
            font-weight: 700 !important;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3) !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-service {
            font-size: 7px !important;
            line-height: 1.0 !important;
            margin-bottom: 0px !important;
            opacity: 0.9 !important;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-time {
            font-size: 7px !important;
            margin-bottom: 0px !important;
            font-weight: 600 !important;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-duration {
            font-size: 6px !important;
            padding: 1px 2px !important;
            background: rgba(255, 255, 255, 0.2) !important;
            border-radius: 2px !important;
            font-weight: 600 !important;
          }

          /* HEADERS DE DÍAS RESPONSIVE */
          .admin-calendar-fullcalendar-container .fc-col-header-cell {
            padding: 6px 2px !important;
            background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%) !important;
            border-right: 1px solid #e5e7eb !important;
          }

          .admin-calendar-fullcalendar-container .fc-col-header-cell-cushion {
            font-size: 10px !important;
            font-weight: 700 !important;
            color: #831843 !important;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.05) !important;
          }

          /* MEJORAR SEPARACIÓN DE DÍAS */
          .admin-calendar-fullcalendar-container .fc-col-header-cell:last-child {
            border-right: none !important;
          }

          /* MEJORAR EXPERIENCIA DE SCROLL */
          .admin-calendar-fullcalendar-container .fc-view-harness {
            scrollbar-width: thin !important;
            scrollbar-color: #d1d5db transparent !important;
          }

          .admin-calendar-fullcalendar-container .fc-view-harness::-webkit-scrollbar {
            height: 6px !important;
            width: 6px !important;
          }

          .admin-calendar-fullcalendar-container .fc-view-harness::-webkit-scrollbar-track {
            background: transparent !important;
          }

          .admin-calendar-fullcalendar-container .fc-view-harness::-webkit-scrollbar-thumb {
            background: #d1d5db !important;
            border-radius: 3px !important;
          }

          .admin-calendar-fullcalendar-container .fc-view-harness::-webkit-scrollbar-thumb:hover {
            background: #9ca3af !important;
          }

          /* MEJORAR VISIBILIDAD GENERAL */
          .admin-calendar-fullcalendar-container .fc-timegrid {
            background: white !important;
          }

          /* OPTIMIZAR PARA PANTALLAS PEQUEÑAS */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
            background: white !important;
          }

          /* MEJORAR VISIBILIDAD DE LÍNEAS EN MÓVIL */
          .admin-calendar-fullcalendar-container .fc-timegrid {
            position: relative !important;
          }

          .admin-calendar-fullcalendar-container .fc-view-harness {
            position: relative !important;
          }

          /* ALINEACIÓN PERFECTA CON HEADERS */
          .admin-calendar-fullcalendar-container .fc-col-header {
            position: relative !important;
            z-index: 10 !important;
          }

          .admin-calendar-fullcalendar-container .fc-col-header-cell {
            position: relative !important;
          }

          /* LÍNEAS VERTICALES ALINEADAS CON HEADERS */
          .admin-calendar-fullcalendar-container .vertical-line {
            top: 0 !important;
            height: 100% !important;
            z-index: 25 !important;
          }

          /* LÍNEAS ESPECÍFICAS PARA MÓVIL - PUEDES MODIFICAR AQUÍ */
          .admin-calendar-fullcalendar-container .vertical-line-mobile {
            /* Ajusta solo las líneas de móvil aquí */
            /* Ejemplo: left: calc(var(--original-left) + 5px) !important; */
          }

          /* LÍNEAS ESPECÍFICAS PARA DESKTOP - PUEDES MODIFICAR AQUÍ */
          .admin-calendar-fullcalendar-container .vertical-line-desktop {
            /* Ajusta solo las líneas de desktop aquí */
            /* Ejemplo: left: calc(var(--original-left) - 2px) !important; */
          }

          /* SLOTS DE TIEMPO RESPONSIVE */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot {
            min-height: 25px !important;
            border-bottom: 1px solid #f3f4f6 !important;
          }

          /* LABELS DE TIEMPO RESPONSIVE */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot-label {
            font-size: 9px !important;
            padding: 2px 4px !important;
            font-weight: 600 !important;
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%) !important;
          }

          /* MEJORAR VISIBILIDAD DE TIEMPO */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot-label-cushion {
            color: white !important;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2) !important;
          }

          /* SCROLL TÁCTIL HABILITADO */
          .admin-calendar-fullcalendar-container .fc-view-harness {
            overflow-x: auto !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            scroll-behavior: smooth !important;
          }

          /* ANCHO MÍNIMO PARA SCROLL HORIZONTAL */
          .admin-calendar-fullcalendar-container .fc-timegrid {
            min-width: 700px !important;
            width: 100% !important;
          }

          /* MEJORAR LAYOUT DEL CALENDARIO EN MÓVIL */
          .admin-calendar-fullcalendar-container .fc {
            font-size: 12px !important;
          }

          /* OPTIMIZAR ESPACIADO EN MÓVIL */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
            min-width: 100px !important;
          }

          /* MEJORAR LEGIBILIDAD DE HEADERS */
          .admin-calendar-fullcalendar-container .fc-col-header-cell-cushion {
            font-size: 11px !important;
            line-height: 1.2 !important;
            padding: 4px 2px !important;
          }

          /* BOTONES DE NAVEGACIÓN MÁS GRANDES */
          .admin-calendar-fullcalendar-container .fc-prev-button,
          .admin-calendar-fullcalendar-container .fc-next-button {
            min-width: 44px !important;
            min-height: 44px !important;
          }

          /* LÍNEAS VERTICALES RESPONSIVE - MEJORADAS */
          .admin-calendar-fullcalendar-container .vertical-line {
            width: 1px !important;
            background-color: #e5e7eb !important;
            opacity: 0.6 !important;
            z-index: 20 !important;
          }

          /* BORDES VERTICALES MÁS SUAVES EN MÓVIL */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot-lane {
            border-right: 1px solid #e5e7eb !important;
          }

          .admin-calendar-fullcalendar-container .fc-col-header-cell {
            border-right: 1px solid #e5e7eb !important;
          }

          /* MEJORAR VISIBILIDAD DE GRID */
          .admin-calendar-fullcalendar-container .fc-timegrid-slot {
            border-bottom: 1px solid #f3f4f6 !important;
          }
        }

        /* RESPONSIVE PARA TABLETS */
        @media (max-width: 1024px) and (min-width: 769px) {
          .admin-calendar-fullcalendar-container .fc-event {
            font-size: 11px !important;
            padding: 4px 8px !important;
            min-height: 26px !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-client {
            font-size: 11px !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-service {
            font-size: 9px !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-time {
            font-size: 9px !important;
          }

          .admin-calendar-fullcalendar-container .fc-event-duration {
            font-size: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
