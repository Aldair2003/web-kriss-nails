'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO, addDays, startOfDay, startOfWeek, endOfWeek } from 'date-fns';
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
        // ✅ CORREGIDO: getMonth() retorna 0-11, necesitamos 1-12
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        
        console.log('🔄 Cargando fechas disponibles para mes:', month, 'año:', year);
        console.log('📅 Fecha actual del estado:', currentMonth.toISOString());
        
        const dates = await getAvailableDates(month, year);
        
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
    vibrate(); // Vibración en móvil
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    console.log('➡️ Navegando al mes siguiente');
    vibrate(); // Vibración en móvil
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Obtener días del mes actual - CORREGIDO: generar grid completo de calendario
  const getDaysInMonth = useMemo(() => {
    // Generar grid completo de calendario incluyendo días de semanas anterior y posterior
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }); // 1 = Lunes
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }); // 1 = Lunes
    
    // DEBUG: Verificar que las fechas se calculen correctamente
    console.log('🔧 AvailabilityManager Debug:', {
      currentMonth: currentMonth.toISOString(),
      start: start.toISOString(),
      end: end.toISOString(),
      startDay: start.getDay(), // Debería ser 1 (lunes)
      endDay: end.getDay()      // Debería ser 7 (domingo)
    });
    
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

  // Función para vibrar en móvil
  const vibrate = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(100); // Vibración corta de 100ms
    }
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
    const baseClasses = 'relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xs md:text-sm font-medium transition-all duration-300 cursor-pointer border-2';
    
    if (isToday(date) && isDateAvailable(date)) {
      // Día que es HOY y está HABILITADO: Verde con borde rosa grueso
      return `${baseClasses} text-white bg-green-500 hover:bg-green-600 border-4 border-pink-400 hover:border-pink-500 transform hover:scale-105`;
    }
    
    if (isToday(date)) {
      // Día que es HOY pero NO está habilitado: Rosa sólido con borde grueso
      return `${baseClasses} text-white bg-pink-500 hover:bg-pink-600 border-4 border-pink-400 hover:border-pink-500 transform hover:scale-105`;
    }
    
    if (isDateAvailable(date)) {
      // Día que NO es hoy pero está HABILITADO: Verde sólido
      return `${baseClasses} text-white bg-green-500 hover:bg-green-600 border-green-400 hover:border-green-500 transform hover:scale-105`;
    }
    
    if (!isSelectable(date)) {
      // Días del pasado (no seleccionables) en gris opaco
      return `${baseClasses} text-gray-400 bg-gray-300 border-gray-400 cursor-not-allowed`;
    }
    
    // Días futuros seleccionables (blancos con borde gris)
    return `${baseClasses} text-gray-700 bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 transform hover:scale-105`;
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
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const dates = await getAvailableDates(month, year);
      setAvailableDates(dates);
      
      // Cerrar modal y notificar cambio
      setShowDatePicker(false);
      setDateRange({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') });
      onAvailabilityChange();
      
      vibrate(); // Vibración en móvil
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
  const handleDayClick = (date: Date, event: React.MouseEvent) => {
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
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const updatedDates = await getAvailableDates(month, year);
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
        const month = currentMonth.getMonth() + 1;
        const year = currentMonth.getFullYear();
        const updatedDates = await getAvailableDates(month, year);
        console.log('🔄 Fechas actualizadas del backend:', updatedDates);
        
        // Usar las fechas del backend para asegurar consistencia
        setAvailableDates(updatedDates);
        
        vibrate(); // Vibración en móvil
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
              className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 text-sm md:text-base"
            >
              <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Abrir Rango de Días</span>
              <span className="sm:hidden">+ Rango</span>
            </button>
          </div>
        </div>

        {/* Navegación de meses con Swipe */}
        <motion.div 
          className="flex items-center justify-between mb-6 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(event, info) => {
            if (info.offset.x > 100) {
              handlePreviousMonth();
            } else if (info.offset.x < -100) {
              handleNextMonth();
            }
          }}
          whileDrag={{ scale: 0.98 }}
        >
          <button
            onClick={handlePreviousMonth}
            className="p-3 hover:bg-pink-50 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <ChevronLeftIcon className="w-6 h-6 text-pink-600" />
          </button>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-900"
            key={currentMonth.toISOString()}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </motion.h2>
          
          <button
            onClick={handleNextMonth}
            className="p-3 hover:bg-pink-50 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <ChevronRightIcon className="w-6 h-6 text-pink-600" />
          </button>
        </motion.div>



        {/* Estilos CSS personalizados para animaciones */}
        <style jsx>{`
          @keyframes glow {
            0%, 100% { 
              box-shadow: 0 0 5px rgb(236 72 153); /* pink-400 */
            }
            50% { 
              box-shadow: 0 0 15px rgb(236 72 153), 0 0 25px rgb(219 39 119); /* pink-600 */
            }
          }
          
          .animate-glow {
            animation: glow 3s ease-in-out infinite;
          }
        `}</style>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Días de la semana - CORREGIDO: orden correcto empezando en lunes */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2 md:py-3">
              {day}
            </div>
          ))}

          {/* Días del mes */}
          {getDaysInMonth.map((date) => (
            <div key={date.toISOString()} className="relative flex justify-center">
              <button
                onClick={(event) => handleDayClick(date, event)}
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
            <div className="w-4 h-4 bg-green-500 border-2 border-green-400 rounded"></div>
            <span className="text-gray-600">Días abiertos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 border-4 border-pink-400 rounded"></div>
            <span className="text-gray-600">Hoy + Habilitado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-500 border-4 border-pink-400 rounded"></div>
            <span className="text-gray-600">Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded"></div>
            <span className="text-gray-600">Días del pasado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
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
