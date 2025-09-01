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
  const { appointments, loading } = useAppointments();
  const { toast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [view, setView] = useState<string>('timeGridWeek');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

    // Formatear citas para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!appointments || appointments.length === 0) {
      return [];
    }
    
    try {
      const formatted = appointments.map((appointment) => {
        try {
          const formattedEvent = formatAppointmentForCalendar(appointment);
          
          // ✅ Usar fechas UTC con timeZone: 'local' para correcta visualización
          const startISO = formattedEvent.start.toISOString();
          const endISO = formattedEvent.end.toISOString();
          
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

        // Obtener las columnas de días del calendario para posicionamiento dinámico
        const dayColumns = calendarContainer.querySelectorAll('.fc-timegrid-col');
        
        // Verificar que el calendario esté completamente renderizado
        if (dayColumns.length < 7) {
          // Si no hay 7 columnas, el calendario no está completamente renderizado
          return;
        }
        
        if (dayColumns.length >= 7) {
          // Verificar si las líneas ya están en la posición correcta
          const existingLines = calendarContainer.querySelectorAll('.vertical-line');
          if (existingLines.length === 7 && isInitialized) {
            // Verificar si las posiciones actuales son correctas
            let positionsCorrect = true;
            existingLines.forEach((line, index) => {
              const currentLeft = parseFloat((line as HTMLElement).style.left);
              const column = dayColumns[index];
              const columnRect = column.getBoundingClientRect();
              const containerRect = calendarContainer.getBoundingClientRect();
              const expectedLeft = ((columnRect.right - containerRect.left) / containerRect.width) * 100;
              
              if (Math.abs(currentLeft - expectedLeft) > 0.5) {
                positionsCorrect = false;
              }
            });
            
            if (positionsCorrect) {
              return; // No reajustar si las posiciones están correctas
            }
          }
          
          // POSICIONES RESPONSIVE BASADAS EN LAS COLUMNAS REALES
          const linePositions = [
            { id: 1, columnIndex: 0, description: 'Domingo-Lunes' },
            { id: 2, columnIndex: 1, description: 'Lunes-Martes' },
            { id: 3, columnIndex: 2, description: 'Martes-Miércoles' },
            { id: 4, columnIndex: 3, description: 'Miércoles-Jueves' },
            { id: 5, columnIndex: 4, description: 'Jueves-Viernes' },
            { id: 6, columnIndex: 5, description: 'Viernes-Sábado' },
            { id: 7, columnIndex: 6, description: 'Sábado-Fin' }
          ];

          // Agregar líneas verticales responsive
          linePositions.forEach(({ id, columnIndex, description }) => {
            const line = document.createElement('div');
            line.className = `vertical-line vertical-line-${id}`;
            line.setAttribute('data-line-id', id.toString());
            line.setAttribute('data-description', description);
            
            // Calcular posición basada en la columna real
            const column = dayColumns[columnIndex];
            const columnRect = column.getBoundingClientRect();
            const containerRect = calendarContainer.getBoundingClientRect();
            const relativeLeft = ((columnRect.right - containerRect.left) / containerRect.width) * 100;
            
                             line.style.cssText = `
                   position: absolute;
                   top: 0;
                   left: ${relativeLeft}%;
                   width: 2px;
                   height: 100%;
                   background-color: #d1d5db;
                   z-index: 10;
                   pointer-events: none;
                   transform: translateX(-50%);
                 `;
            calendarContainer.appendChild(line);
          });
          
          isInitialized = true;
        }
      }
    };

    // Ejecutar después de que el calendario se renderice
    const timer = setTimeout(addVerticalLines, 1000);
    
    // Ejecutar múltiples veces para asegurar posicionamiento correcto
    const timer2 = setTimeout(addVerticalLines, 1500);
    const timer3 = setTimeout(addVerticalLines, 2000);
    const timer4 = setTimeout(addVerticalLines, 2500);
    
    // Agregar listener para redimensionamiento
    const handleResize = () => {
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
      <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border border-pink-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500 rounded-xl shadow-lg">
              <CalendarIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calendario de Citas
              </h2>
              <p className="text-gray-700">
                Gestiona y programa las citas de Rachell
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-pink-600" />
                  <span className="text-sm text-gray-600 font-medium">
                    Horario: 6:00 AM - 11:00 PM
                  </span>
                </div>
                {!loadingDates && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    {availableDates.length} días habilitados
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleCreateNewAppointment}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            <CalendarIcon className="w-5 h-5" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Calendario FullCalendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm admin-calendar-fullcalendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
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
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl border border-pink-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              Leyenda del Calendario
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        onCreate={() => {}}
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

        /* ESTILOS RESPONSIVE PARA LÍNEAS VERTICALES */
        .admin-calendar-fullcalendar-container .vertical-line {
          position: absolute !important;
          top: 0 !important;
          width: 2px !important;
          height: 100% !important;
          background-color: #d1d5db !important;
          z-index: 10 !important;
          pointer-events: none !important;
          transform: translateX(-50%) !important;
          transition: left 0.3s ease !important;
        }

        /* RESPONSIVE BREAKPOINTS */
        @media (max-width: 1200px) {
          .admin-calendar-fullcalendar-container .vertical-line {
            width: 1px !important;
          }
        }

        @media (max-width: 768px) {
          .admin-calendar-fullcalendar-container .vertical-line {
            width: 1px !important;
            top: 0 !important;
            height: 100% !important;
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

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .admin-calendar-fullcalendar-container .fc-header-toolbar {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 12px 16px !important;
          }

          .admin-calendar-fullcalendar-container .fc-toolbar-title {
            font-size: 16px !important;
          }

          .admin-calendar-fullcalendar-container .fc-button {
            padding: 6px 12px !important;
            font-size: 11px !important;
          }

          .admin-calendar-fullcalendar-container .fc-event {
            font-size: 10px !important;
            padding: 2px 6px !important;
            min-height: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
