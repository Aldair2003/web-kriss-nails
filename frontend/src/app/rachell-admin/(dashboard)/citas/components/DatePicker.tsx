'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates: string[];
  className?: string;
}

export function DatePicker({ selectedDate, onDateSelect, availableDates, className = '' }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Generar días del mes actual - CORREGIDO: usar lunes como primer día de la semana
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }); // 1 = Lunes
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }); // 1 = Lunes
    
    // DEBUG: Verificar que las fechas se calculen correctamente
    console.log('🔧 DatePicker Debug:', {
      currentMonth: currentMonth.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
      startDay: start.getDay(), // Debería ser 1 (lunes)
      endDay: end.getDay()      // Debería ser 7 (domingo)
    });
    
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Verificar si un día está habilitado
  const isDateEnabled = (date: Date) => {
    // ✅ ADMIN CALENDAR: Si availableDates contiene '*', permitir todas las fechas
    if (availableDates.includes('*')) {
      return true;
    }
    
    const dateString = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateString);
  };

  // Verificar si es el día seleccionado
  const isSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  // Verificar si es hoy
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  // Navegar al mes anterior
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navegar al mes siguiente
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Función para vibrar en móvil
  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // Vibración corta de 50ms
    }
  };

  // Manejar eventos touch para navegación
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextMonth();
    } else if (isRightSwipe) {
      goToPreviousMonth();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Seleccionar fecha con debounce para evitar múltiples toques
  const handleDateSelect = (date: Date) => {
    if (isDateEnabled(date)) {
      vibrate(); // Vibración de confirmación
      
      const selectedDateTime = new Date(date);
      
      // Siempre mantener la hora actual si existe
      if (selectedDate) {
        selectedDateTime.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      } else {
        // Solo usar 6:00 AM por defecto si realmente no hay hora seleccionada
        selectedDateTime.setHours(6, 0, 0, 0);
      }
      
      console.log('📅 DatePicker - Nueva fecha seleccionada:', selectedDateTime);
      console.log('📅 DatePicker - Hora preservada:', selectedDateTime.getHours() + ':' + selectedDateTime.getMinutes());
      
      onDateSelect(selectedDateTime);
    }
  };

  // Obtener clases CSS para cada día - MEJORADO para móviles
  const getDayClasses = (date: Date) => {
    let baseClasses = 'w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-sm font-semibold rounded-xl cursor-pointer transition-all duration-150 select-none touch-manipulation';
    
    if (!isDateEnabled(date)) {
      return `${baseClasses} text-gray-400 bg-gray-100 cursor-not-allowed opacity-50 active:scale-100`;
    }
    
    if (isSelected(date)) {
      return `${baseClasses} bg-gradient-to-r from-pink-500 to-pink-600 text-white active:from-pink-600 active:to-pink-700 shadow-lg transform scale-105 active:scale-110`;
    }
    
    if (isToday(date)) {
      return `${baseClasses} bg-blue-100 text-blue-700 active:bg-blue-200 border-2 border-blue-300 font-bold active:scale-105`;
    }
    
    return `${baseClasses} text-gray-700 bg-white active:bg-pink-50 active:text-pink-700 border border-gray-200 active:border-pink-300 active:shadow-md active:scale-105`;
  };

  return (
    <div 
      className={`bg-white rounded-2xl border border-gray-200 shadow-2xl mx-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header del calendario mejorado */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-pink-100 rounded-t-2xl">
        <button
          onClick={goToPreviousMonth}
          className="p-3 md:p-2 hover:bg-white/50 active:bg-white/70 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation"
        >
          <ChevronLeftIcon className="w-6 h-6 text-pink-600" />
        </button>
        
        <h3 className="text-xl font-bold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-3 md:p-2 hover:bg-white/50 active:bg-white/70 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation"
        >
          <ChevronRightIcon className="w-6 h-6 text-pink-600" />
        </button>
      </div>

      {/* Días de la semana mejorados */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 p-6 pb-4">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3">
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes mejorados - Área táctil aumentada */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 px-6 pb-6">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div
              key={index}
              onClick={() => handleDateSelect(day)}
              className={`${getDayClasses(day)} p-1`} // Padding adicional para área táctil
              role="button"
              tabIndex={0}
              aria-label={`Seleccionar ${format(day, 'EEEE d MMMM', { locale: es })}`}
            >
              {isCurrentMonth ? format(day, 'd') : ''}
            </div>
          );
        })}
      </div>

      {/* Información de días habilitados mejorada */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-100 p-6 rounded-b-2xl">
        <div className="flex items-center justify-center gap-3 text-sm font-medium text-blue-700">
          <CalendarIcon className="w-5 h-5" />
          <span>{availableDates.length} días habilitados para citas</span>
        </div>
      </div>
    </div>
  );
}
