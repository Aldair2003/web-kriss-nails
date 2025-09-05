'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay, isToday as dateFnsIsToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/toast';
import { 
  createMultiplePublicHours,
  getPublicHoursByDateRange,
  deletePublicHour
} from '@/services/public-hours-service';
import { getAvailableDates } from '@/services/availability-service';

interface PublicHour {
  id: string;
  hour: string;
  isAvailable: boolean;
}

interface DayHours {
  [date: string]: PublicHour[];
}

// Genera intervalos de 30 minutos entre 06:00 y 23:00
const generateHalfHourRange = (start: string, end: string): string[] => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const result: string[] = [];
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
    const m = (currentMinutes % 60).toString().padStart(2, '0');
    result.push(`${h}:${m}`);
    currentMinutes += 30;
  }
  return result;
};

const AVAILABLE_HOURS = generateHalfHourRange('06:00', '23:00');

export function PublicHoursManager() {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [dayHours, setDayHours] = useState<DayHours>({});
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rangeStartHour, setRangeStartHour] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'single' | 'range'>('range');

  // Debug: Log de la fecha actual del sistema
  console.log('🔍 Debug - Fecha actual del sistema:', {
    newDate: new Date().toISOString(),
    newDateLocal: new Date().toLocaleDateString(),
    newDateDay: new Date().getDay(),
    newDateDayName: format(new Date(), 'EEEE', { locale: es })
  });

  useEffect(() => {
    loadExistingHours();
  }, []);

  // Cargar días habilitados para la semana visible
  useEffect(() => {
    const loadEnabledDays = async () => {
      try {
        const month1 = currentWeek.getMonth() + 1;
        const year1 = currentWeek.getFullYear();
        const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
        const month2 = end.getMonth() + 1;
        const year2 = end.getFullYear();
        const dates1 = await getAvailableDates(month1, year1);
        const dates2 = (month2 !== month1 || year2 !== year1) ? await getAvailableDates(month2, year2) : [];
        setAvailableDates([...(dates1 || []), ...(dates2 || [])]);
      } catch (e) {
        setAvailableDates([]);
      }
    };
    loadEnabledDays();
    // Limpiar selección si semana cambia para evitar inconsistencias
    setSelectedDates([]);
    setSelectedHours([]);
  }, [currentWeek]);

  const loadExistingHours = async () => {
    try {
      setLoading(true);
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(addDays(new Date(), 28), 'yyyy-MM-dd');
      console.log('🔍 Debug - Cargando horarios desde:', startDate, 'hasta:', endDate);
      const list = await getPublicHoursByDateRange(startDate, endDate);
      console.log('🔍 Debug - Horarios cargados:', list);
      const convertedData: DayHours = {};
      list.forEach(item => {
        const dateKey = item.availability.date.split('T')[0];
        console.log('🔍 Debug - Procesando fecha:', dateKey, 'para item:', item);
        if (!convertedData[dateKey]) convertedData[dateKey] = [];
        convertedData[dateKey].push({
          id: item.id,
          hour: item.hour,
          isAvailable: item.isAvailable
        });
      });
      console.log('🔍 Debug - Datos convertidos:', convertedData);
      setDayHours(convertedData);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los horarios existentes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Generar días de la semana en zona local para evitar problemas de UTC
  const weekDays = useMemo(() => {
    const today = new Date();
    const startWeek = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const endWeek = endOfWeek(currentWeek, { weekStartsOn: 1 });
    
    // Crear fechas locales para evitar problemas de zona horaria
    const localWeekDays = eachDayOfInterval({ start: startWeek, end: endWeek }).map(day => {
      // Crear fecha local usando los componentes de fecha
      const year = day.getFullYear();
      const month = day.getMonth();
      const date = day.getDate();
      return new Date(year, month, date, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria
    });
    
    console.log('🔍 Debug weekDays (LOCAL):', {
      currentWeek: currentWeek.toISOString(),
      currentWeekLocal: currentWeek.toLocaleDateString(),
      weekDays: localWeekDays.map(day => ({
        date: day.toISOString(),
        local: day.toLocaleDateString(),
        dayOfWeek: day.getDay(),
        dayName: format(day, 'EEE', { locale: es }),
        dateStr: format(day, 'yyyy-MM-dd')
      }))
    });
    
    return localWeekDays;
  }, [currentWeek]);

  const goToPreviousWeek = () => setCurrentWeek(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentWeek(prev => addDays(prev, 7));

  const isEnabledDay = (dateStr: string) => availableDates.includes(dateStr);
  const isPastDay = (dateStr: string) => {
    const today = new Date();
    const d = new Date(dateStr);
    // Si es el día actual, no se considera pasado
    if (isToday(dateStr)) {
      return false;
    }
    // Para otros días, comparar con el inicio del día actual
    return d < startOfDay(today);
  };
  const isToday = (dateStr: string) => {
    // Crear fecha local para comparación correcta
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    const today = new Date();
    
    // Usar isSameDay para comparación local correcta
    const isTodayResult = isSameDay(date, today);
    
    console.log('🔍 Debug isToday (LOCAL):', {
      dateStr,
      date: date.toISOString(),
      dateLocal: date.toLocaleDateString(),
      today: today.toISOString(),
      todayLocal: today.toLocaleDateString(),
      isTodayResult
    });
    
    return isTodayResult;
  };

  // Verificar si una hora ya pasó para el día actual
  const isPastHour = (hour: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Convertir la hora del string a minutos desde medianoche
    const [hourStr, minuteStr] = hour.split(':');
    const hourNum = parseInt(hourStr);
    const minuteNum = parseInt(minuteStr);
    const hourInMinutes = hourNum * 60 + minuteNum;
    
    // Convertir la hora actual a minutos desde medianoche
    const currentInMinutes = currentHour * 60 + currentMinute;
    
    // Si estamos en el día actual, solo permitir horas futuras
    return hourInMinutes <= currentInMinutes;
  };

  const toggleDate = (date: string) => {
    if (isPastDay(date)) {
      toast({ title: 'Día pasado', description: 'No puedes configurar horarios en días anteriores a hoy', variant: 'destructive' });
      return;
    }
    if (!isEnabledDay(date)) {
      toast({ title: 'Día no habilitado', description: 'Primero habilita el día en la pestaña "Días Habilitados"', variant: 'destructive' });
      return;
    }
    setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  const toggleHour = (hour: string) => {
    // Verificar si la hora ya pasó para el día actual
    const isPastHourForToday = selectedDates.some(date => isToday(date)) && isPastHour(hour);
    if (isPastHourForToday) {
      return; // No permitir seleccionar horas pasadas
    }
    setSelectedHours(prev => prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]);
  };

  const selectAllHours = () => {
    // Solo seleccionar horas futuras si el día actual está seleccionado
    const availableHours = selectedDates.some(date => isToday(date)) 
      ? AVAILABLE_HOURS.filter(hour => !isPastHour(hour))
      : AVAILABLE_HOURS;
    setSelectedHours(availableHours);
  };
  const deselectAllHours = () => setSelectedHours([]);
  
  // Selección por rango: primer click define inicio, segundo click define fin e incluye intermedios
  const handleHourClick = (hour: string, e?: React.MouseEvent) => {
    // Verificar si la hora ya pasó para el día actual
    const isPastHourForToday = selectedDates.some(date => isToday(date)) && isPastHour(hour);
    if (isPastHourForToday) {
      return; // No permitir seleccionar horas pasadas
    }
    
    // Ctrl/Cmd click siempre hace toggle individual
    if (e?.ctrlKey || e?.metaKey || selectionMode === 'single') {
      toggleHour(hour);
      setRangeStartHour(null);
      return;
    }
    // Modo rango
    if (!rangeStartHour) {
      setRangeStartHour(hour);
      // Marcar visualmente el inicio también
      setSelectedHours(prev => prev.includes(hour) ? prev : [...prev, hour]);
      return;
    }
    // Segundo click: calcular rango e incluir todas
    const startIdx = AVAILABLE_HOURS.indexOf(rangeStartHour);
    const endIdx = AVAILABLE_HOURS.indexOf(hour);
    if (startIdx === -1 || endIdx === -1) {
      setRangeStartHour(null);
      return;
    }
    const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    const range = AVAILABLE_HOURS.slice(from, to + 1);
    setSelectedHours(prev => Array.from(new Set([...prev, ...range])));
    setRangeStartHour(null);
  };

  const saveConfiguration = async () => {
    if (selectedDates.length === 0 || selectedHours.length === 0) {
      toast({ title: 'Configuración incompleta', description: 'Selecciona al menos un día y una hora', variant: 'destructive' });
      return;
    }
    // Validar que todas las fechas estén habilitadas
    const invalid = selectedDates.filter(d => !isEnabledDay(d));
    if (invalid.length > 0) {
      toast({ title: 'Días no habilitados', description: 'Algunas fechas seleccionadas no están habilitadas. Revísalas.', variant: 'destructive' });
      return;
    }

    try {
      setSaving(true);
      console.log('🔍 Debug - Fechas seleccionadas:', selectedDates);
      for (const date of selectedDates) {
        console.log('🔍 Debug - Guardando para fecha:', date);
        const hoursData = { date, hours: selectedHours };
        await createMultiplePublicHours(hoursData);
      }
      toast({ title: 'Horarios guardados', description: `Configuración guardada para ${selectedDates.length} días` });
      await loadExistingHours();
      setSelectedDates([]);
      setSelectedHours([]);
    } catch (error) {
      console.error('Error guardando horarios:', error);
      toast({ title: 'Error', description: 'No se pudieron guardar los horarios', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteHour = async (_date: string, hourId: string) => {
    try {
      await deletePublicHour(hourId);
      await loadExistingHours();
      toast({ title: 'Horario eliminado', description: 'El horario ha sido eliminado correctamente' });
    } catch (error) {
      console.error('Error eliminando horario:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el horario', variant: 'destructive' });
    }
  };

  const getHoursForDate = (date: string) => dayHours[date] || [];
  const isDateSelected = (date: string) => selectedDates.includes(date);
  const isHourSelected = (hour: string) => selectedHours.includes(hour);
  const isHourConfiguredForAllSelected = (hour: string) => {
    if (selectedDates.length === 0) return false;
    return selectedDates.every(d => getHoursForDate(d).some(h => h.hour === hour));
  };

  return (
    <div className="space-y-6">
      {/* Paso 1 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold">1</span>
            <h3 className="text-lg font-semibold text-gray-900">Selecciona los días habilitados</h3>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={goToPreviousWeek} 
              className="p-2 sm:p-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <ChevronLeftIcon className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
            </button>
            <span className="text-sm sm:text-base font-medium text-gray-700 text-center">
              {format(weekDays[0], 'dd MMM', { locale: es })} – {format(weekDays[6], 'dd MMM yyyy', { locale: es })}
            </span>
            <button 
              onClick={goToNextWeek} 
              className="p-2 sm:p-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <ChevronRightIcon className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-4">Solo podrás seleccionar días que estén habilitados en "Días Habilitados".</p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const count = getHoursForDate(dateStr).length;
            const enabled = isEnabledDay(dateStr);
            const selected = isDateSelected(dateStr);
            const past = isPastDay(dateStr);
            const todayFlag = isToday(dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(dateStr)}
                disabled={!enabled || past}
                className={`aspect-square p-2 sm:p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative ${
                  past
                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                    : !enabled
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : selected
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {todayFlag && (
                  <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500 text-white border border-pink-600 shadow-sm">Hoy</span>
                )}
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wide font-medium text-gray-500">{format(day, 'EEE', { locale: es })}</div>
                <div className={`text-base sm:text-lg font-bold ${todayFlag ? 'text-pink-700' : ''}`}>{format(day, 'd')}</div>
                {count > 0 && <div className="text-[8px] sm:text-[10px] text-gray-500">{count} horas</div>}
              </button>
            );
          })}
        </div>
        {selectedDates.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Días seleccionados ({selectedDates.length}):</div>
            <div className="flex flex-nowrap sm:flex-wrap gap-2 overflow-x-auto no-scrollbar py-1">
              {selectedDates.map(date => (
                <span key={date} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-sm">
                  {format(new Date(date), 'EEE d MMM', { locale: es })}
                  <button onClick={() => toggleDate(date)} className="hover:text-pink-900">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Paso 2 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs font-semibold">2</span>
            <h3 className="text-lg font-semibold text-gray-900">Selecciona las horas</h3>
          </div>
          {selectedDates.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">Modo de selección:</div>
              <div className="w-full sm:w-auto inline-flex bg-gray-100 rounded-md p-1 text-sm">
                <button
                  className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded transition-colors text-sm font-medium ${selectionMode === 'single' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
                  onClick={() => { setSelectionMode('single'); setRangeStartHour(null); }}
                >
                  Individual
                </button>
                <button
                  className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded transition-colors text-sm font-medium ${selectionMode === 'range' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
                  onClick={() => { setSelectionMode('range'); setRangeStartHour(null); }}
                >
                  Rango
                </button>
              </div>
            </div>
          )}
        </div>
        {selectedDates.length === 0 ? (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-yellow-800 text-sm">Primero selecciona uno o más días habilitados.</div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 text-sm text-gray-600">
              <div>Para: <span className="font-medium">{selectedDates.length} día(s)</span></div>
              <div className="flex gap-2">
                <button onClick={selectAllHours} className="px-4 py-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors font-medium">Seleccionar todas</button>
                <button onClick={deselectAllHours} className="px-4 py-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium">Deseleccionar</button>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2">
              {AVAILABLE_HOURS.map((hour) => {
                // Verificar si la hora ya pasó para el día actual
                const isPastHourForToday = selectedDates.some(date => isToday(date)) && isPastHour(hour);
                
                return (
                  <button
                    key={hour}
                    onClick={(e) => handleHourClick(hour, e)}
                    disabled={isPastHourForToday}
                    className={`aspect-square p-1.5 sm:p-2 rounded-md border transition-all flex items-center justify-center ${
                      isPastHourForToday
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        : isHourConfiguredForAllSelected(hour)
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : isHourSelected(hour)
                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs font-medium text-center">{hour}</div>
                  </button>
                );
              })}
            </div>
            
            {/* Leyenda de horas */}
            {selectedDates.some(date => isToday(date)) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-200 opacity-50"></div>
                  <span>Horas pasadas del día actual no están disponibles</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={saveConfiguration}
                disabled={saving || selectedHours.length === 0}
                className="w-full sm:w-auto px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 justify-center font-medium"
              >
                {saving ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>) : (<><CheckIcon className="w-4 h-4" />Guardar configuración</>)}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Paso 3 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <EyeIcon className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Horarios configurados</h3>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Cargando horarios...</p>
          </div>
        ) : Object.keys(dayHours).length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No hay horarios configurados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(dayHours).map(([date, hours]) => (
              <div key={date} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: es })}</h4>
                  <span className="text-sm text-gray-500">{hours.length} horas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hours.map((hour) => (
                    <div key={hour.id} className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs sm:text-sm">
                      <span>{hour.hour}</span>
                      <button onClick={() => deleteHour(date, hour.id)} className="text-green-600 hover:text-green-800">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
