'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { getAppointments, type Appointment } from '@/services/appointment-service';
import { AppointmentModal } from './AppointmentModal';

interface Filters {
  status: Appointment['status'] | 'ALL';
  date: string;
  search: string;
}

export function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: 'ALL',
    date: '',
    search: ''
  });

  // Cargar citas
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const response = await getAppointments({ limit: 1000 });
        setAppointments(response.appointments);
        setFilteredAppointments(response.appointments);
      } catch (error) {
        console.error('Error cargando citas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...appointments];

    // Filtro por estado
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Filtro por fecha
    if (filters.date) {
      filtered = filtered.filter(apt => 
        apt.date.split('T')[0] === filters.date
      );
    }

    // Filtro por búsqueda
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.clientName.toLowerCase().includes(search) ||
        (apt.clientEmail?.toLowerCase().includes(search) || false) ||
        apt.clientPhone.includes(search)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, filters]);

  const handleAppointmentUpdate = () => {
    // Recargar citas después de actualización
    getAppointments({ limit: 1000 }).then(response => {
      setAppointments(response.appointments);
    });
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'CONFIRMED': return 'Confirmada';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cliente
            </label>
            <input
              type="text"
              placeholder="Nombre, email o teléfono..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Citas ({filteredAppointments.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <AnimatePresence>
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay citas
                </h3>
                <p className="text-gray-600">
                  No se encontraron citas con los filtros seleccionados.
                </p>
              </div>
            ) : (
              filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>

                      {/* Cliente Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {appointment.clientName}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {appointment.clientEmail && (
                                <span className="flex items-center">
                                  <EnvelopeIcon className="w-3 h-3 mr-1" />
                                  {appointment.clientEmail}
                                </span>
                              )}
                              <span className="flex items-center">
                                <PhoneIcon className="w-3 h-3 mr-1" />
                                {appointment.clientPhone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cita Info */}
                      <div className="hidden md:block text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <div className="text-right">
                            <p className="font-medium">
                              {format(new Date(appointment.date), 'dd MMM yyyy', { locale: es })}
                            </p>
                            <p className="text-gray-600">
                              {format(new Date(appointment.date), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Servicios */}
                      <div className="hidden lg:block text-sm text-gray-900">
                        <p className="font-medium">
                          {appointment.service.name}
                        </p>
                        <p className="text-gray-600">
                          ${appointment.service.price.toLocaleString()} • {appointment.service.duration} min
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="inline-flex items-center p-2 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Info */}
                  <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <ClockIcon className="w-4 h-4" />
                        <span>
                          {format(new Date(appointment.date), 'dd MMM', { locale: es })} • 
                          {format(new Date(appointment.date), 'HH:mm', { locale: es })}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        ${appointment.service.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de detalles */}
      <AppointmentModal
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={handleAppointmentUpdate}
      />
    </div>
  );
}
