'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  formatAppointmentForCalendar,
  type Appointment,
  getAvailableAppointmentSlots,
  getAvailableDates
} from '@/services/appointment-service';
import { useAppointments } from '@/contexts/AppointmentContext';
import { AppointmentModal } from './AppointmentModal';
import { NewAppointmentModal } from './NewAppointmentModal';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // CORREGIDO: usar lunes como primer día
  getDay: (date: Date) => {
    const day = getDay(date);
    // Convertir de 0-6 (domingo-sábado) a 1-7 (lunes-domingo)
    return day === 0 ? 7 : day;
  },
  locales: { 'es': es }
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
  backgroundColor: string;
  borderColor: string;
}

export function AdminCalendar() {
  const { appointments, loading } = useAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [view, setView] = useState<View>('week');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  // Formatear citas para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return (appointments || []).map(formatAppointmentForCalendar);
  }, [appointments]);

  // Manejar click en cita existente
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
  }, []);

  // Manejar click en slot vacío (crear nueva cita)
  const handleSelectSlot = useCallback(async (slotInfo: SlotInfo) => {
    // Asegurar que la hora esté en el horario de trabajo (8 AM - 6 PM)
    let startTime = new Date(slotInfo.start);
    let endTime = new Date(slotInfo.end);
    
    // Si es selección de día completo, usar horario por defecto
    if (slotInfo.action === 'select') {
      startTime = setHours(setMinutes(startTime, 0), 9); // 9:00 AM
      endTime = setHours(setMinutes(startTime, 0), 10); // 10:00 AM
    }
    
    // Asegurar que esté en horario de trabajo
    const hour = startTime.getHours();
    if (hour < 8) {
      startTime = setHours(startTime, 9);
      endTime = setHours(endTime, 10);
    } else if (hour > 18) {
      startTime = setHours(startTime, 9);
      endTime = setHours(endTime, 10);
    }

    // PASO 1: Verificar si el día está habilitado
    const selectedDate = startTime.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    if (!availableDates.includes(selectedDate)) {
      alert('Este día no está habilitado para citas. Solo se pueden crear citas en días habilitados.');
      return;
    }

    // PASO 2: Si el día está habilitado, permitir crear la cita
    setSelectedSlot({ start: startTime, end: endTime });
    setShowNewAppointment(true);
  }, [availableDates]);

  // Función para manejar cambios en eventos (para uso futuro)
  const handleEventChange = useCallback((info: any) => {
    console.log('Evento modificado:', info);
    // TODO: Implementar actualización de cita cuando se agregue drag & drop
  }, []);

  // Función para personalizar las propiedades del calendario
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        borderRadius: '8px',
        borderWidth: '2px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };
  }, []);

  // Función para personalizar los slots del calendario
  const slotPropGetter = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const isAvailable = availableDates.includes(dateString);
    
    if (!isAvailable) {
      return {
        className: 'rbc-disabled',
        style: {
          backgroundColor: '#f3f4f6',
          opacity: 0.5,
          pointerEvents: 'none' as const
        }
      };
    }
    
    return {
      className: 'rbc-enabled',
      style: {
        backgroundColor: '#f0fdf4',
        borderLeft: '3px solid #22c55e'
      }
    };
  }, [availableDates]);

  // Función para crear nueva cita desde el botón
  const handleCreateNewAppointment = () => {
    const now = new Date();
    const startTime = setHours(setMinutes(now, 0), 9); // 9:00 AM
    const endTime = setHours(setMinutes(now, 0), 10); // 10:00 AM
    
    setSelectedSlot({ start: startTime, end: endTime });
    setShowNewAppointment(true);
  };

  // Cargar fechas disponibles al montar el componente
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        setLoadingDates(true);
        const now = new Date();
        // ✅ CORREGIDO: getMonth() retorna 0-11, necesitamos 1-12
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        console.log('🔄 AdminCalendar cargando fechas para mes:', currentMonth, 'año:', currentYear);
        
        // Cargar fechas del mes actual y el siguiente
        const dates = await getAvailableDates(currentMonth, currentYear);
        console.log('📅 Fechas disponibles cargadas:', dates);
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error al cargar fechas disponibles:', error);
      } finally {
        setLoadingDates(false);
      }
    };

    loadAvailableDates();
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
      {/* Header simplificado */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Calendario de Citas
              </h2>
              <p className="text-gray-600">
                Gestiona y programa las citas de Rachell
              </p>
              {!loadingDates && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {availableDates.length} días habilitados
                  </span>
                  <span className="text-xs text-gray-500">
                    Solo se pueden crear citas en días habilitados
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleCreateNewAppointment}
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm admin-calendar-container">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          views={['month', 'week', 'day', 'agenda']}
          view={view}
          onView={setView}
          defaultView="week"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          step={30}
          timeslots={2}
          min={setHours(new Date(), 8)} // 8:00 AM
          max={setHours(new Date(), 18)} // 6:00 PM
          style={{ height: 700 }}
          eventPropGetter={eventPropGetter}
          slotPropGetter={slotPropGetter}
          culture="es"
          messages={{
            today: 'Hoy',
            previous: 'Anterior',
            next: 'Siguiente',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            allDay: 'Todo el día',
            noEventsInRange: 'No hay citas en este rango',
            showMore: total => `+ Ver más (${total})`
          }}
        />
        
        {/* Leyenda de disponibilidad mejorada */}
        {!loadingDates && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              Leyenda de Disponibilidad
            </h4>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 rounded-lg shadow-sm"></div>
                <span className="text-gray-700 font-medium">Días habilitados</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg shadow-sm opacity-60"></div>
                <span className="text-gray-600 font-medium">Días no habilitados</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-br from-pink-100 to-pink-200 border-2 border-pink-400 rounded-lg shadow-sm"></div>
                <span className="text-gray-700 font-medium">Hoy</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 rounded-lg shadow-sm"></div>
                <span className="text-gray-700 font-medium">Citas confirmadas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-lg shadow-sm"></div>
                <span className="text-gray-700 font-medium">Citas pendientes</span>
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
        onUpdate={() => {}} // El contexto se actualiza automáticamente
      />

      {/* Modal de nueva cita */}
      <NewAppointmentModal
        open={showNewAppointment}
        slot={selectedSlot}
        onClose={() => {
          setShowNewAppointment(false);
          setSelectedSlot(null);
        }}
        onCreate={() => {}} // El contexto se actualiza automáticamente
      />

      <style jsx global>{`
        .admin-calendar-container .rbc-calendar {
          font-family: inherit;
          font-size: 14px;
        }
        
        .admin-calendar-container .rbc-header {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          font-weight: 700;
          padding: 20px 12px;
          border: none;
          text-align: center;
          font-size: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
        }
        
        .admin-calendar-container .rbc-month-view,
        .admin-calendar-container .rbc-time-view {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          background: white;
        }
        
        .admin-calendar-container .rbc-today {
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
          border: 3px solid #ec4899;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
        }
        
        .admin-calendar-container .rbc-btn-group button {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 20px;
          margin: 0 4px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 13px;
        }
        
        .admin-calendar-container .rbc-btn-group button:hover {
          background: linear-gradient(135deg, #be185d 0%, #9d174d 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(236, 72, 153, 0.4);
        }
        
        .admin-calendar-container .rbc-btn-group button.rbc-active {
          background: linear-gradient(135deg, #be185d 0%, #9d174d 100%);
          box-shadow: 0 6px 16px rgba(236, 72, 153, 0.5);
          transform: scale(1.05);
        }
        
        .admin-calendar-container .rbc-time-slot {
          border-color: #f3e8ff;
        }
        
        .admin-calendar-container .rbc-time-gutter,
        .admin-calendar-container .rbc-time-header-gutter {
          background-color: #fafafa;
          border-color: #f3e8ff;
          font-weight: 500;
        }

        /* Estilos para días no habilitados - Mejorado */
        .admin-calendar-container .rbc-day-slot.rbc-disabled {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          opacity: 0.6;
          pointer-events: none;
          position: relative;
        }

        .admin-calendar-container .rbc-day-slot.rbc-disabled::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            #e2e8f0 2px,
            #e2e8f0 4px
          );
          opacity: 0.3;
        }

        .admin-calendar-container .rbc-day-slot.rbc-disabled .rbc-day-bg {
          background: transparent;
        }

        .admin-calendar-container .rbc-day-slot.rbc-disabled .rbc-date {
          color: #94a3b8;
          font-weight: 500;
        }

        /* Estilos para días habilitados - Mejorado */
        .admin-calendar-container .rbc-day-slot.rbc-enabled {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-left: 4px solid #22c55e;
          position: relative;
          overflow: hidden;
        }

        .admin-calendar-container .rbc-day-slot.rbc-enabled::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 20px 20px 0;
          border-color: transparent #22c55e transparent transparent;
        }

        .admin-calendar-container .rbc-day-slot.rbc-enabled .rbc-day-bg {
          background: transparent;
        }

        /* Estilos para slots no seleccionables */
        .admin-calendar-container .rbc-slot.rbc-disabled {
          background-color: #fef2f2;
          border-color: #fecaca;
          pointer-events: none;
        }

        .admin-calendar-container .rbc-slot.rbc-disabled .rbc-label {
          color: #dc2626;
        }
        
        .admin-calendar-container .rbc-event {
          border-radius: 12px;
          padding: 4px 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          border: 2px solid;
        }
        
        .admin-calendar-container .rbc-event:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        }
        
        .admin-calendar-container .rbc-slot-selecting {
          background-color: rgba(236, 72, 153, 0.1);
          border: 2px dashed #ec4899;
        }

        /* Scrollbar personalizado */
        .admin-calendar-container .rbc-time-content::-webkit-scrollbar {
          width: 8px;
        }

        .admin-calendar-container .rbc-time-content::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .admin-calendar-container .rbc-time-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
          border-radius: 4px;
        }

        .admin-calendar-container .rbc-time-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #be185d 0%, #9d174d 100%);
        }

        /* Mejoras en las celdas del calendario */
        .admin-calendar-container .rbc-day-bg {
          transition: all 0.2s ease;
        }

        .admin-calendar-container .rbc-day-bg:hover {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
}

// Estilos para diferentes estados de citas
const eventPropGetter = (event: CalendarEvent) => {
  const status = event.resource.status;
  let backgroundColor = '#ec4899'; // PINK por defecto
  let borderColor = '#be185d';

  switch (status) {
    case 'CONFIRMED':
      backgroundColor = '#10b981'; // GREEN
      borderColor = '#059669';
      break;
    case 'PENDING':
      backgroundColor = '#f59e0b'; // YELLOW
      borderColor = '#d97706';
      break;
    case 'COMPLETED':
      backgroundColor = '#3b82f6'; // BLUE
      borderColor = '#2563eb';
      break;
    case 'CANCELLED':
      backgroundColor = '#ef4444'; // RED
      borderColor = '#dc2626';
      break;
  }

  return {
    style: {
      backgroundColor,
      borderColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  };
};
