'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarDaysIcon, 
  PlusIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { getAvailableDates, enableDate, enableDateRange, removeDate } from '@/services/availability-service';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/pink-dialog';

interface AvailabilityManagerProps {
  onAvailabilityChange: () => void;
}

interface DateRange {
  start: string;
  end: string;
}

export function AvailabilityManager({ onAvailabilityChange }: AvailabilityManagerProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar fechas disponibles
  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando fechas disponibles para:', currentMonth.getMonth() + 1, currentMonth.getFullYear());
        
        const dates = await getAvailableDates(
          currentMonth.getMonth() + 1,
          currentMonth.getFullYear()
        );
        
        console.log('📅 Fechas obtenidas del backend:', dates);
        setAvailableDates(dates);
      } catch (error) {
        console.error('Error cargando fechas disponibles:', error);
        setAvailableDates([]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableDates();
  }, [currentMonth]);

  // Navegar entre meses
  const handlePreviousMonth = () => {
    console.log('⬅️ Navegando al mes anterior');
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    console.log('➡️ Navegando al mes siguiente');
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Obtener días del mes actual
  const getDaysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Verificar si una fecha está disponible
  const isDateAvailable = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return availableDates.includes(dateString);
  };

  // Verificar si una fecha es hoy
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  // Verificar si una fecha es del mes actual
  const isCurrentMonth = (date: Date) => {
    return isSameMonth(date, currentMonth);
  };

  // Verificar si una fecha es seleccionable
  const isSelectable = (date: Date) => {
    // No permitir fechas pasadas (pero sí el día actual)
    if (date < startOfDay(new Date())) {
      return false;
    }
    
    // No permitir fechas de otros meses
    if (!isCurrentMonth(date)) {
      return false;
    }
    
    return true;
  };

  // Obtener clase CSS para cada día
  const getDayClasses = (date: Date) => {
    const baseClasses = 'relative w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer';
    
    if (isToday(date)) {
      return `${baseClasses} text-white bg-pink-500 hover:bg-pink-600 shadow-lg`;
    }
    
    if (isDateAvailable(date)) {
      return `${baseClasses} text-white bg-green-500 hover:bg-green-600 shadow-lg`;
    }
    
    if (!isSelectable(date)) {
      return `${baseClasses} text-gray-400 bg-gray-100 cursor-not-allowed`;
    }
    
    return `${baseClasses} text-gray-700 bg-white border border-gray-200 hover:border-pink-300 hover:bg-pink-50`;
  };

  // Habilitar rango de días
  const handleEnableDateRange = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast({
        title: 'Error',
        description: 'Selecciona un rango de fechas válido',
        variant: 'destructive',
      });
      return;
    }

    const startDate = parseISO(dateRange.start);
    const endDate = parseISO(dateRange.end);

    if (startDate > endDate) {
      toast({
        title: 'Error',
        description: 'La fecha de inicio debe ser anterior a la fecha de fin',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await enableDateRange({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      // Recargar datos
      const dates = await getAvailableDates(
        currentMonth.getMonth() + 1,
        currentMonth.getFullYear()
      );
      setAvailableDates(dates);
      
      // Cerrar modal y notificar cambio
      setShowDatePicker(false);
      setDateRange({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') });
      onAvailabilityChange();
      
      toast({
        title: 'Éxito',
        description: result.message,
        variant: 'success',
      });
      
    } catch (error) {
      console.error('Error habilitando días:', error);
      toast({
        title: 'Error',
        description: 'Error al habilitar los días. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar click en día
  const handleDayClick = (date: Date) => {
    if (!isSelectable(date)) {
      return; // No hacer nada en días no válidos
    }

    const dateString = format(date, 'yyyy-MM-dd');
    
    if (isDateAvailable(date)) {
      // Si está disponible, mostrar modal de eliminar
      setSelectedDate(dateString);
      setShowDeleteModal(true);
    } else {
      // Si no está disponible, habilitarlo directamente
      handleEnableDate(dateString);
    }
  };

  // Habilitar un día
  const handleEnableDate = async (date: string) => {
    try {
      console.log('✅ Habilitando día:', date);
      
      const result = await enableDate(date);
      console.log('✅ Respuesta del backend:', result);
      
      // Actualizar estado local inmediatamente
      setAvailableDates(prev => [...prev, date]);
      
      // Recargar fechas del backend para asegurar sincronización
      const updatedDates = await getAvailableDates(
        currentMonth.getMonth() + 1,
        currentMonth.getFullYear()
      );
      console.log('🔄 Fechas actualizadas del backend:', updatedDates);
      
      // Usar las fechas del backend para asegurar consistencia
      setAvailableDates(updatedDates);
      
      onAvailabilityChange();
      toast({
        title: 'Éxito',
        description: `Día ${date} habilitado correctamente`,
        variant: 'success',
      });
      
    } catch (error) {
      console.error('Error habilitando día:', error);
      toast({
        title: 'Error',
        description: 'Error al habilitar el día. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Eliminar completamente un día
  const handleRemoveDate = async (date: string) => {
    try {
      console.log('🗑️ Eliminando día:', date);
      
      const result = await removeDate(date);
      console.log('🗑️ Respuesta del backend:', result);
      
      if (result.removed) {
        // Recargar fechas del backend para asegurar sincronización
        const updatedDates = await getAvailableDates(
          currentMonth.getMonth() + 1,
          currentMonth.getFullYear()
        );
        console.log('🔄 Fechas actualizadas del backend:', updatedDates);
        
        // Usar las fechas del backend para asegurar consistencia
        setAvailableDates(updatedDates);
        
        onAvailabilityChange();
        setShowDeleteModal(false);
        toast({
          title: 'Éxito',
          description: `Día ${date} eliminado completamente del sistema`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'Info',
          description: `El día ${date} no existía en el sistema`,
          variant: 'info',
        });
      }
      
    } catch (error) {
      console.error('Error eliminando día:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el día. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Calcular estadísticas
  const stats = {
    availableDays: availableDates.length,
    totalDays: getDaysInMonth.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-100 rounded-xl shadow-md">
              <CalendarDaysIcon className="w-8 h-8 text-pink-600" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                Horarios de Trabajo
              </h3>
              <p className="text-gray-600 text-lg">
                Configura los días disponibles para atención
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Estadísticas rápidas */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.availableDays}</div>
                <div className="text-sm text-gray-500">Días abiertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{stats.totalDays - stats.availableDays}</div>
                <div className="text-sm text-gray-500">Días cerrados</div>
              </div>
            </div>

            {/* Botón para habilitar rango de días */}
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-md"
            >
              <PlusIcon className="w-5 h-5" />
              + Abrir Rango de Días
            </button>
          </div>
        </div>

        {/* Navegación de meses */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-2">
          {/* Días de la semana */}
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}

          {/* Días del mes */}
          {getDaysInMonth.map((date) => (
            <div key={date.toISOString()} className="relative">
              <button
                onClick={() => handleDayClick(date)}
                className={getDayClasses(date)}
                disabled={!isSelectable(date)}
              >
                {format(date, 'd')}
                
                {/* Indicador de día clickeable */}
                {isSelectable(date) && (
                  <div className="absolute bottom-1 right-1 w-4 h-4 text-pink-500 hover:text-pink-700 transition-colors">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Días abiertos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded"></div>
            <span className="text-gray-600">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">Días cerrados</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
            <span className="text-gray-600">Click para gestionar</span>
          </div>
        </div>
      </div>

      {/* Modal para seleccionar rango de fechas */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 text-center">
              Habilitar Rango de Días
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              Selecciona el rango de días que quieres habilitar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de fin *
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                min={dateRange.start}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <button
              onClick={() => setShowDatePicker(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnableDateRange}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? 'Habilitando...' : 'Habilitar Días'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar día */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => handleRemoveDate(selectedDate)}
        title={`Eliminar Día ${selectedDate}`}
        message="¿Estás seguro de que quieres eliminar completamente este día del sistema?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
