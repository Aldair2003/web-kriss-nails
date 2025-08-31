'use client';

import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
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

  // Seleccionar fecha
  const handleDateSelect = (date: Date) => {
    if (isDateEnabled(date)) {
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

  // Obtener clases CSS para cada día
  const getDayClasses = (date: Date) => {
    let baseClasses = 'w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg cursor-pointer transition-all duration-200';
    
    if (!isDateEnabled(date)) {
      return `${baseClasses} text-gray-400 bg-gray-100 cursor-not-allowed opacity-50`;
    }
    
    if (isSelected(date)) {
      return `${baseClasses} bg-pink-500 text-white hover:bg-pink-600 shadow-lg`;
    }
    
    if (isToday(date)) {
      return `${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-300`;
    }
    
    return `${baseClasses} text-gray-700 bg-white hover:bg-pink-50 hover:text-pink-700 border border-gray-200 hover:border-pink-300`;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-lg ${className}`}>
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Días de la semana - CORREGIDO: orden correcto empezando en lunes */}
      <div className="grid grid-cols-7 gap-1 p-4">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-4">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div
              key={index}
              onClick={() => handleDateSelect(day)}
              className={getDayClasses(day)}
            >
              {isCurrentMonth ? format(day, 'd') : ''}
            </div>
          );
        })}
      </div>

      

      {/* Información de días habilitados */}
      <div className="bg-gray-50 border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>{availableDates.length} días habilitados para citas</span>
        </div>
      </div>
    </div>
  );
}
