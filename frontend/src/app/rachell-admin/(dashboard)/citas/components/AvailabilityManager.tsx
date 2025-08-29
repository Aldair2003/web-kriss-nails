'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDaysIcon, PlusIcon, MinusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getAvailableDates, createAvailability, deleteAvailability } from '@/services/availability-service';

interface AvailabilityManagerProps {
  onAvailabilityChange: () => void;
}

export function AvailabilityManager({ onAvailabilityChange }: AvailabilityManagerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newDate, setNewDate] = useState('');

  // Cargar fechas disponibles del mes actual
  useEffect(() => {
    loadAvailableDates();
  }, [currentMonth]);

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      const month = currentMonth.getMonth() + 1; // getMonth() retorna 0-11
      const year = currentMonth.getFullYear();
      const dates = await getAvailableDates(month, year);
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error cargando fechas disponibles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleAddDate = async () => {
    if (!newDate) return;

    try {
      setLoading(true);
      await createAvailability({ date: newDate });
      await loadAvailableDates();
      setNewDate('');
      setShowDatePicker(false);
      onAvailabilityChange();
    } catch (error) {
      console.error('Error agregando fecha:', error);
      alert('Error al agregar la fecha');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDate = async (dateString: string) => {
    if (!confirm(`¿Estás seguro de que quieres cerrar el ${format(new Date(dateString), 'dd MMMM yyyy', { locale: es })}?`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteAvailability(dateString);
      await loadAvailableDates();
      onAvailabilityChange();
    } catch (error) {
      console.error('Error removiendo fecha:', error);
      alert('Error al remover la fecha');
    } finally {
      setLoading(false);
    }
  };

  const isDateAvailable = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateString);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getDayClass = (date: Date) => {
    const baseClasses = "w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors cursor-pointer";
    
    if (isDateAvailable(date)) {
      return `${baseClasses} bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-300`;
    }
    
    if (isSameDay(date, new Date())) {
      return `${baseClasses} bg-pink-100 text-pink-800 border-2 border-pink-300`;
    }
    
    return `${baseClasses} bg-gray-50 text-gray-600 hover:bg-gray-100`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-6 h-6 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Gestión de Fechas de Trabajo
          </h3>
        </div>
        
        <button
          onClick={() => setShowDatePicker(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Abrir Nueva Fecha
        </button>
      </div>

      {/* Navegación del mes */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-xl font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h4>
        
        <button
          onClick={handleNextMonth}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth().map((date, index) => {
          // Ajustar para que el primer día del mes comience en el día correcto de la semana
          const dayOfWeek = date.getDay();
          const isFirstWeek = index < 7;
          const shouldShow = isFirstWeek ? dayOfWeek === date.getDay() : true;
          
          if (!shouldShow && isFirstWeek) {
            return <div key={`empty-${index}`} className="w-10 h-10" />;
          }

          return (
            <motion.div
              key={date.toISOString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={getDayClass(date)}
              onClick={() => setSelectedDate(date)}
            >
              {format(date, 'd')}
            </motion.div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span className="text-gray-600">Fechas abiertas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-100 border-2 border-pink-300 rounded"></div>
          <span className="text-gray-600">Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
          <span className="text-gray-600">Fechas cerradas</span>
        </div>
      </div>

      {/* Modal para agregar fecha */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Abrir Nueva Fecha de Trabajo
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDate}
                  disabled={!newDate || loading}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Abriendo...' : 'Abrir Fecha'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isDateAvailable(selectedDate) ? 'Cerrar Fecha' : 'Abrir Fecha'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {isDateAvailable(selectedDate) 
                ? `¿Estás seguro de que quieres cerrar el ${format(selectedDate, 'dd MMMM yyyy', { locale: es })}?`
                : `¿Quieres abrir el ${format(selectedDate, 'dd MMMM yyyy', { locale: es })} para trabajo?`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDate(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (isDateAvailable(selectedDate)) {
                    handleRemoveDate(format(selectedDate, 'yyyy-MM-dd'));
                  } else {
                    setNewDate(format(selectedDate, 'yyyy-MM-dd'));
                    setShowDatePicker(true);
                  }
                  setSelectedDate(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  isDateAvailable(selectedDate)
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isDateAvailable(selectedDate) ? 'Cerrar' : 'Abrir'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
