'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  getAppointments, 
  formatAppointmentForCalendar,
  type Appointment 
} from '@/services/appointment-service';
import { AppointmentModal } from './AppointmentModal';
import { NewAppointmentModal } from './NewAppointmentModal';
import { PlusIcon } from '@heroicons/react/24/outline';

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('week');

  // Cargar citas
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const response = await getAppointments({ limit: 1000 });
        setAppointments(response?.appointments || []);
      } catch (error) {
        console.error('Error cargando citas:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // Formatear citas para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return (appointments || []).map(formatAppointmentForCalendar);
  }, [appointments]);

  // Manejar click en cita existente
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
  }, []);

  // Manejar click en slot vacío (crear nueva cita)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowNewAppointment(true);
  }, []);

  // Función para manejar cambios en eventos (para uso futuro)
  const handleEventChange = useCallback((info: any) => {
    console.log('Evento modificado:', info);
    // TODO: Implementar actualización de cita cuando se agregue drag & drop
  }, []);

  // Recargar citas después de cambios
  const handleAppointmentChange = useCallback(() => {
    getAppointments({ limit: 1000 }).then(response => {
      setAppointments(response?.appointments || []);
    }).catch(error => {
      console.error('Error recargando citas:', error);
      setAppointments([]);
    });
  }, []);

  // Estilos para diferentes estados de citas
  const eventPropGetter = useCallback((event: CalendarEvent) => ({
    style: {
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      border: `2px solid ${event.borderColor}`,
      borderRadius: '6px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '500'
    }
  }), []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Calendario Administrativo
            </h2>
            <span className="text-sm text-gray-500">
              ({appointments.length} citas)
            </span>
          </div>
          
          <button
            onClick={() => {
              setSelectedSlot({ 
                start: new Date(), 
                end: new Date(Date.now() + 60 * 60 * 1000) 
              });
              setShowNewAppointment(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 admin-calendar-container">
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
          style={{ height: 600 }}
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
        onUpdate={handleAppointmentChange}
      />

      {/* Modal de nueva cita */}
      <NewAppointmentModal
        open={showNewAppointment}
        slot={selectedSlot}
        onClose={() => {
          setShowNewAppointment(false);
          setSelectedSlot(null);
        }}
        onCreate={handleAppointmentChange}
      />

      <style jsx global>{`
        .admin-calendar-container .rbc-calendar {
          font-family: inherit;
          font-size: 14px;
        }
        
        .admin-calendar-container .rbc-header {
          background: linear-gradient(135deg, #ec4899, #f472b6);
          color: white;
          font-weight: 600;
          padding: 12px 8px;
          border-bottom: 1px solid #e5e7eb;
          text-align: center;
        }
        
        .admin-calendar-container .rbc-month-view,
        .admin-calendar-container .rbc-time-view {
          border: 1px solid #f9a8d4;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .admin-calendar-container .rbc-today {
          background-color: #fdf2f8;
        }
        
        .admin-calendar-container .rbc-btn-group button {
          background-color: #ec4899;
          color: white;
          border: 1px solid #ec4899;
          border-radius: 6px;
          padding: 8px 16px;
          margin: 0 2px;
          font-weight: 500;
        }
        
        .admin-calendar-container .rbc-btn-group button:hover {
          background-color: #be185d;
          border-color: #be185d;
        }
        
        .admin-calendar-container .rbc-btn-group button.rbc-active {
          background-color: #be185d;
          border-color: #be185d;
          box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
        }
        
        .admin-calendar-container .rbc-time-slot {
          border-color: #f3e8ff;
        }
        
        .admin-calendar-container .rbc-time-gutter,
        .admin-calendar-container .rbc-time-header-gutter {
          background-color: #fafafa;
          border-color: #f3e8ff;
        }
      `}</style>
    </div>
  );
}
