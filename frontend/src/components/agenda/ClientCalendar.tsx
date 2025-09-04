'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  getAppointments, 
  getAvailableSlots, 
  formatAppointmentForCalendar,
  type Appointment,
  type AvailableSlot 
} from '@/services/appointment-service';
import { getActiveServices, type Service } from '@/services/service-service';
import { getAvailableDates, type Availability } from '@/services/availability-service';
import { TimeSlotModal } from '@/components/agenda/TimeSlotModal';
import { BookingModal } from '@/components/agenda/BookingModal';

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

export function ClientCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [appointmentsData, servicesData] = await Promise.all([
          getAppointments({ status: 'CONFIRMED' }), // Solo citas confirmadas para mostrar en calendario
          getActiveServices()
        ]);
        
        setAppointments(appointmentsData.appointments);
        setServices(servicesData);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar fechas disponibles
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0); // 2 meses hacia adelante
        
        const dates = await getAvailableDates(
          startDate.getMonth() + 1, 
          startDate.getFullYear()
        );
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error cargando fechas disponibles:', error);
      }
    };

    loadAvailableDates();
  }, []);

  // Formatear citas para el calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return appointments?.map(formatAppointmentForCalendar) || [];
  }, [appointments]);

  // Calcular duración total de servicios seleccionados
  const totalDuration = useMemo(() => {
    return selectedServices.reduce((total, service) => total + (service.duration || 0), 0);
  }, [selectedServices]);

  // Manejar selección de fecha
  const handleSelectSlot = useCallback(async (slotInfo: { start: Date; end: Date }) => {
    if (!selectedServices.length) {
      alert('Por favor, selecciona al menos un servicio antes de elegir una fecha.');
      return;
    }

    try {
      setSlotsLoading(true);
      setSelectedDate(slotInfo.start);
      
      const dateStr = format(slotInfo.start, 'yyyy-MM-dd');
      const slots = await getAvailableSlots(dateStr, totalDuration);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      alert('Error al cargar los horarios disponibles');
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedServices.length, totalDuration]);

  // Colorear días según disponibilidad
  const dayPropGetter = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isAvailable = availableDates.includes(dateStr);
    const hasAppointments = appointments?.some(apt => 
      isSameDay(new Date(apt.date), date)
    ) || false;
    
    const isPast = date < new Date();
    
    if (isPast) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          color: '#9ca3af',
          cursor: 'not-allowed'
        }
      };
    }
    
    if (!isAvailable) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          color: '#9ca3af',
          cursor: 'not-allowed'
        }
      };
    }
    
    if (hasAppointments) {
      return {
        style: {
          backgroundColor: '#fce7f3',
          color: '#be185d',
          fontWeight: '500'
        }
      };
    }
    
    return {
      style: {
        backgroundColor: '#fefefe',
        cursor: selectedServices.length > 0 ? 'pointer' : 'default',
        transition: 'all 0.15s',
        minHeight: '80px', // Área táctil mínima
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };
  }, [appointments, selectedServices.length, availableDates]);

  // Propiedades de eventos (citas ocupadas)
  const eventPropGetter = useCallback(() => ({
    style: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fecaca',
      color: '#991b1b',
      fontSize: '12px',
      borderRadius: '4px'
    }
  }), []);

  // Manejar selección de slot de tiempo
  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  // Cerrar modals
  const handleCloseTimeSlots = () => {
    setSelectedDate(null);
    setAvailableSlots([]);
  };

  const handleCloseBooking = () => {
    setSelectedSlot(null);
  };

  // Manejar envío exitoso de reserva
  const handleBookingSuccess = () => {
    setSelectedSlot(null);
    setSelectedDate(null);
    setSelectedServices([]);
    // Recargar citas
    getAppointments({ status: 'CONFIRMED' }).then(data => {
      setAppointments(data.appointments);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Selecciona la fecha para tu cita
        </h2>
        <p className="text-gray-600">
          Primero elige tus servicios, luego selecciona una fecha abierta para citas en el calendario
        </p>
      </div>

      {/* Selector de Servicios */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Servicios Disponibles
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <div 
              key={service.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedServices.some(s => s.id === service.id)
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-pink-300'
              }`}
              onClick={() => {
                setSelectedServices(prev => {
                  const exists = prev.some(s => s.id === service.id);
                  if (exists) {
                    return prev.filter(s => s.id !== service.id);
                  } else {
                    return [...prev, service];
                  }
                });
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <input
                  type="checkbox"
                  checked={selectedServices.some(s => s.id === service.id)}
                  onChange={() => {}} // Controlled by parent click
                  className="text-pink-600 focus:ring-pink-500"
                />
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

        {selectedServices.length > 0 && (
          <div className="mt-6 p-4 bg-pink-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resumen de Servicios</h4>
            <div className="space-y-1">
              {selectedServices.map(service => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span>{service.name}</span>
                  <span>${Number(service.price || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-pink-200 mt-2 pt-2 flex justify-between font-medium">
              <span>Total: {totalDuration} minutos</span>
              <span>
                ${selectedServices.reduce((total, s) => total + Number(s.price || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            views={['month']}
            defaultView="month"
            onSelectSlot={handleSelectSlot}
            onSelectEvent={() => {}} // Deshabilitar click en eventos
            selectable={selectedServices.length > 0}
            className="min-h-[400px] lg:min-h-[500px]"
            dayPropGetter={dayPropGetter}
            eventPropGetter={eventPropGetter}
            culture="es"
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              month: 'Mes',
              noEventsInRange: 'No hay citas en este período',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              allDay: 'Todo el día',
              week: 'Semana',
              day: 'Día',
              agenda: 'Agenda',
              showMore: total => `+ Ver más (${total})`
            }}
          />
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-pink-200 rounded"></div>
            <span className="text-gray-600">Días abiertos para citas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-100 border border-pink-300 rounded"></div>
            <span className="text-gray-600">Días con citas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-gray-600">Días cerrados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-50 border-2 border-pink-500 rounded"></div>
            <span className="text-pink-600 font-medium">Hoy</span>
          </div>
        </div>
      </div>

      {/* Modal de horarios disponibles */}
      <TimeSlotModal
        open={!!selectedDate}
        date={selectedDate}
        slots={availableSlots}
        loading={slotsLoading}
        onClose={handleCloseTimeSlots}
        onSelectSlot={handleSlotSelect}
      />

      {/* Modal de reserva */}
      <BookingModal
        open={!!selectedSlot}
        slot={selectedSlot}
        services={selectedServices}
        onClose={handleCloseBooking}
        onSuccess={handleBookingSuccess}
      />

      <style jsx global>{`
        .calendar-container .rbc-calendar {
          font-family: inherit;
          font-size: 14px;
        }
        
        .calendar-container .rbc-month-view {
          border: 1px solid #f9a8d4;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(236, 72, 153, 0.1);
        }
        
        .calendar-container .rbc-header {
          background: linear-gradient(135deg, #ec4899, #f472b6);
          color: white;
          font-weight: 600;
          padding: 8px 4px;
          border-bottom: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
        }
        
        .calendar-container .rbc-date-cell {
          text-align: center;
          padding: 0 !important;
          min-height: 50px !important;
          display: block !important;
          position: relative !important;
          transition: all 0.2s ease;
          border: 1px solid transparent !important;
          box-sizing: border-box !important;
          margin: 0 !important;
        }
        
        .calendar-container .rbc-date-cell a {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-decoration: none !important;
          color: inherit !important;
          border-radius: 0 !important;
          transition: all 0.2s ease;
          padding: 20px 8px !important;
          min-height: 50px !important;
          box-sizing: border-box !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          margin: 0 !important;
          background-color: transparent !important;
        }
        
        .calendar-container .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        
        .calendar-container .rbc-today {
          background-color: #fdf2f8 !important;
          font-weight: 600;
          color: #ec4899;
          position: relative;
        }
        
        .calendar-container .rbc-today::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 2px solid #ec4899;
          border-radius: 4px;
          pointer-events: none;
        }
        
        .calendar-container .rbc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 10px;
        }
        
        /* Botones de navegación */
        .calendar-container .rbc-btn-group button {
          background-color: #ec4899;
          color: white;
          border: 1px solid #ec4899;
          border-radius: 6px;
          padding: 8px 16px;
          margin: 0 2px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .calendar-container .rbc-btn-group button:hover {
          background-color: #be185d;
          border-color: #be185d;
          transform: translateY(-1px);
        }
        
        .calendar-container .rbc-btn-group button.rbc-active {
          background-color: #be185d;
          border-color: #be185d;
          box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
        }
        
        /* Hover effect solo en días seleccionables */
        .calendar-container .rbc-date-cell.rbc-selectable {
          background-color: #fefefe !important;
          cursor: pointer;
        }
        
        .calendar-container .rbc-date-cell.rbc-selectable a:hover {
          background-color: #fdf2f8 !important;
          color: #be185d !important;
          font-weight: 600 !important;
        }
        
        /* Hover para día actual cuando es seleccionable */
        .calendar-container .rbc-date-cell.rbc-today.rbc-selectable a:hover {
          background-color: #fdf2f8 !important;
          color: #be185d !important;
          font-weight: 600 !important;
        }
        
        /* Cuando no hay servicios seleccionados */
        .calendar-container .rbc-date-cell:not(.rbc-selectable) a:hover {
          background-color: transparent !important;
          cursor: default;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .calendar-container .rbc-header {
            padding: 6px 2px;
            font-size: 11px;
          }
          
          .calendar-container .rbc-date-cell {
            min-height: 40px !important;
            font-size: 12px;
          }
          
          .calendar-container .rbc-date-cell a {
            padding: 15px 4px !important;
            min-height: 40px !important;
          }
          
          .calendar-container .rbc-calendar {
            font-size: 12px;
          }
          
          .calendar-container .rbc-btn-group button {
            padding: 6px 12px;
            font-size: 12px;
            margin: 0 1px;
          }
        }
        
        @media (max-width: 640px) {
          .calendar-container .rbc-header {
            padding: 4px 1px;
            font-size: 10px;
          }
          
          .calendar-container .rbc-date-cell {
            min-height: 35px !important;
            font-size: 11px;
          }
          
          .calendar-container .rbc-date-cell a {
            padding: 12px 3px !important;
            min-height: 35px !important;
          }
          
          .calendar-container .rbc-btn-group button {
            padding: 4px 8px;
            font-size: 11px;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
