'use client';

import { useState } from 'react';
import { AdminCalendar } from './components/AdminCalendar';
import { AppointmentList } from './components/AppointmentList';
import { AppointmentStats } from './components/AppointmentStats';
import { AvailabilityManager } from './components/AvailabilityManager';
import { CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';

type ViewMode = 'calendar' | 'list';

export default function CitasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  return (
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
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
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

      {/* Stats */}
      <AppointmentStats />

      {/* Availability Manager */}
      <AvailabilityManager onAvailabilityChange={() => {
        // Recargar datos cuando cambie la disponibilidad
        window.location.reload();
      }} />

      {/* Main Content */}
      <div className="min-h-[600px]">
        {viewMode === 'calendar' ? (
          <AdminCalendar />
        ) : (
          <AppointmentList />
        )}
      </div>
    </div>
  );
}
