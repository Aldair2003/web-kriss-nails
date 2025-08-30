'use client';

import { motion } from 'framer-motion';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useAppointments } from '@/contexts/AppointmentContext';

export function AppointmentStats() {
  const { appointments, loading } = useAppointments();

  // Solo mostrar información básica de disponibilidad
  const availableDays = appointments.length > 0 ? 
    appointments.filter(apt => apt.status === 'CONFIRMED').length : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-pink-100 rounded-xl">
          <CalendarDaysIcon className="w-8 h-8 text-pink-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Gestión de Días de Trabajo
          </h3>
          <p className="text-gray-600">
            Administra los días disponibles para atención al cliente
          </p>
        </div>
      </div>
    </motion.div>
  );
}
