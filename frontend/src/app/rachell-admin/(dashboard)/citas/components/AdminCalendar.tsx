'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  formatAppointmentForCalendar,
  type Appointment 
} from '@/services/appointment-service';
import { useAppointments } from '@/contexts/AppointmentContext';
import { AppointmentModal } from './AppointmentModal';
import { NewAppointmentModal } from './NewAppointmentModal';
import { PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
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

  // Formatear citas para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return (appointments || []).map(formatAppointmentForCalendar);
  }, [appointments]);

  // Manejar click en cita existente
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
  }, []);

  // Manejar click en slot vacío (crear nueva cita)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
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
    
    setSelectedSlot({ start: startTime, end: endTime });
    setShowNewAppointment(true);
  }, []);

  // Función para manejar cambios en eventos (para uso futuro)
  const handleEventChange = useCallback((info: any) => {
    console.log('Evento modificado:', info);
    // TODO: Implementar actualización de cita cuando se agregue drag & drop
  }, []);

  // Función para crear nueva cita desde el botón
  const handleCreateNewAppointment = () => {
    const now = new Date();
    const startTime = setHours(setMinutes(now, 0), 9); // 9:00 AM
    const endTime = setHours(setMinutes(now, 0), 10); // 10:00 AM
    
    setSelectedSlot({ start: startTime, end: endTime });
    setShowNewAppointment(true);
  };

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
          background-color: #ec4899;
          color: white;
          font-weight: 600;
          padding: 16px 8px;
          border-bottom: 1px solid #e5e7eb;
          text-align: center;
          font-size: 14px;
        }
        
        .admin-calendar-container .rbc-month-view,
        .admin-calendar-container .rbc-time-view {
          border: 1px solid #f9a8d4;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .admin-calendar-container .rbc-today {
          background-color: #fdf2f8;
          border: 2px solid #ec4899;
        }
        
        .admin-calendar-container .rbc-btn-group button {
          background-color: #ec4899;
          color: white;
          border: 1px solid #ec4899;
          border-radius: 8px;
          padding: 10px 18px;
          margin: 0 3px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .admin-calendar-container .rbc-btn-group button:hover {
          background-color: #be185d;
          border-color: #be185d;
          transform: translateY(-1px);
        }
        
        .admin-calendar-container .rbc-btn-group button.rbc-active {
          background-color: #be185d;
          border-color: #be185d;
          box-shadow: 0 4px 8px rgba(236, 72, 153, 0.4);
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
        
        .admin-calendar-container .rbc-event {
          border-radius: 8px;
          padding: 2px 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .admin-calendar-container .rbc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .admin-calendar-container .rbc-slot-selecting {
          background-color: rgba(236, 72, 153, 0.1);
          border: 2px dashed #ec4899;
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
