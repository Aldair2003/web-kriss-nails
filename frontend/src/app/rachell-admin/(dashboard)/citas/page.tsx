'use client';

import { useState, useCallback } from 'react';
import { AdminCalendarFullCalendar } from './components/AdminCalendarFullCalendar';
import { AppointmentList } from './components/AppointmentList';
import { AppointmentStats } from './components/AppointmentStats';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';
import { AppointmentProvider } from '@/contexts/AppointmentContext';
import { CalendarIcon, ListBulletIcon, ClockIcon } from '@heroicons/react/24/outline';

type ViewMode = 'calendar' | 'list';

export default function CitasPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successClientName, setSuccessClientName] = useState('');

  // Función para manejar la creación exitosa de una cita
  const handleAppointmentCreated = useCallback((clientName: string) => {
    console.log('🔍 DEBUG Page - handleAppointmentCreated llamado con:', clientName);
    console.log('🔍 DEBUG Page - Estado actual showSuccessAnimation:', showSuccessAnimation);
    setSuccessClientName(clientName);
    setShowSuccessAnimation(true);
    console.log('🔍 DEBUG Page - Animación activada para:', clientName);
  }, [showSuccessAnimation]);

  // Función para recargar todos los datos
  const handleRefreshData = useCallback(() => {
    console.log('🔍 DEBUG Page - handleRefreshData llamado');
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <AppointmentProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-pink-500" />
            Gestión de Citas
          </h1>
          <p className="text-gray-600 mt-1">
            Administra las citas y la agenda de Rachell
          </p>
        </div>

        {/* Availability Manager removido de esta página */}

        {/* View Toggle - Entre Horarios de Trabajo y Calendario de Citas */}
        <div className="flex justify-end">
          <div className="inline-flex bg-gray-100 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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

        {/* Main Content */}
        <div className="min-h-[600px]">
          {viewMode === 'calendar' ? (
            <AdminCalendarFullCalendar key={`calendar-${refreshKey}`} />
          ) : (
            <div className="space-y-6">
              {/* Calendario de Citas Header para Lista */}
              <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-xl border border-pink-200 p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500 rounded-xl shadow-lg">
                      <CalendarIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Calendario de Citas
                      </h2>
                      <p className="text-gray-700">
                        Gestiona y programa las citas de Rachell
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-pink-600" />
                          <span className="text-sm text-gray-600 font-medium">
                            Horario: 6:00 AM - 11:00 PM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowNewAppointment(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    <CalendarIcon className="w-5 h-5" />
                    Nueva Cita
                  </button>
                </div>
              </div>
              
              {/* Lista de Citas */}
              <AppointmentList key={`list-${refreshKey}`} />
            </div>
          )}
        </div>

        {/* Modal de nueva cita */}
        <NewAppointmentModal
          open={showNewAppointment}
          slot={selectedSlot}
          onClose={() => {
            setShowNewAppointment(false);
            setSelectedSlot(null);
          }}
          onCreate={(clientName: string) => {
            console.log('🔍 DEBUG Page - onCreate llamado con nombre:', clientName);
            setShowNewAppointment(false);
            setSelectedSlot(null);
            console.log('🔍 DEBUG Page - Llamando handleRefreshData...');
            handleRefreshData();
            console.log('🔍 DEBUG Page - Llamando handleAppointmentCreated...');
            handleAppointmentCreated(clientName);
            console.log('🔍 DEBUG Page - onCreate completado');
          }}
        />

        {/* Animación de éxito */}
        <SuccessAnimation
          isVisible={showSuccessAnimation}
          onClose={() => {
            setShowSuccessAnimation(false);
          }}
          clientName={successClientName}
        />
      </div>
    </AppointmentProvider>
  );
}
