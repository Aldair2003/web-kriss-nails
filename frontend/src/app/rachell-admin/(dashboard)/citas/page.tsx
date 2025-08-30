'use client';

import { useState, useCallback } from 'react';
import { AdminCalendar } from './components/AdminCalendar';
import { AppointmentList } from './components/AppointmentList';
import { AppointmentStats } from './components/AppointmentStats';
import { AvailabilityManager } from './components/AvailabilityManager';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';

type ViewMode = 'calendar' | 'list';

export default function CitasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [refreshKey, setRefreshKey] = useState(0);

  // Función para recargar todos los datos
  const handleRefreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <AppointmentProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Citas
            </h1>
            <p className="text-gray-600 mt-1">
              Administra las citas y la agenda de Rachell
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendario
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* Availability Manager - Ahora es el componente principal */}
        <AvailabilityManager onAvailabilityChange={handleRefreshData} />

        {/* Main Content */}
        <div className="min-h-[600px]">
          {viewMode === 'calendar' ? (
            <AdminCalendar key={`calendar-${refreshKey}`} />
          ) : (
            <AppointmentList key={`list-${refreshKey}`} />
          )}
        </div>
      </div>
    </AppointmentProvider>
  );
}
