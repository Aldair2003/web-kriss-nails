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
import { type Appointment } from '@/services/appointment-service';
import { AppointmentModal } from './AppointmentModal';
import { useAppointments } from '@/contexts/AppointmentContext';

interface Filters {
  status: Appointment['status'] | 'ALL';
  date: string;
  search: string;
}

export function AppointmentList() {
  const { appointments, loading } = useAppointments();
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: 'ALL',
    date: '',
    search: ''
  });

  // Función para convertir minutos a formato de horas
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  };

  // Inicializar filteredAppointments cuando se cargan las citas
  useEffect(() => {
    setFilteredAppointments(appointments);
  }, [appointments]);

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
       <div className="space-y-6">
         {/* Filtros Loading */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
             <div className="space-y-2">
               <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
               <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
             </div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="space-y-3">
                 <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                 <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
               </div>
             ))}
           </div>
         </div>

         {/* Lista Loading */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
           <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-6 py-4 border-b border-gray-200">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
               <div className="space-y-2">
                 <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                 <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
               </div>
             </div>
           </div>
           <div className="divide-y divide-gray-100">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="p-6 animate-pulse">
                 <div className="flex items-center gap-6">
                   <div className="w-20 h-8 bg-gray-200 rounded-full"></div>
                   <div className="flex items-center gap-4 flex-1">
                     <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                     <div className="flex-1 space-y-2">
                       <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                       <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                     </div>
                   </div>
                   <div className="hidden md:block w-24 h-16 bg-gray-200 rounded-lg"></div>
                   <div className="hidden lg:block w-32 h-16 bg-gray-200 rounded-lg"></div>
                   <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
   }

  return (
    <div className="space-y-4 sm:space-y-6">
             {/* Filtros */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
         <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
           <div className="p-1.5 sm:p-2 bg-pink-500 rounded-lg shadow-sm">
             <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
           </div>
           <div>
             <h3 className="text-base sm:text-lg font-bold text-gray-900">Filtros</h3>
             <p className="text-xs sm:text-sm text-gray-600">Filtra las citas según tus necesidades</p>
           </div>
         </div>
         
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div>
               <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                 Estado
               </label>
               <select
                 value={filters.status}
                 onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                 className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:border-pink-300 text-sm"
               >
               <option value="ALL">Todos los estados</option>
               <option value="PENDING">Pendientes</option>
               <option value="CONFIRMED">Confirmadas</option>
               <option value="COMPLETED">Completadas</option>
               <option value="CANCELLED">Canceladas</option>
             </select>
           </div>

           <div>
             <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
               Fecha
             </label>
             <input
               type="date"
               value={filters.date}
               onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
               className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:border-pink-300 text-sm"
             />
           </div>

           <div>
             <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
               Buscar Cliente
             </label>
             <input
               type="text"
               placeholder="Nombre, email o teléfono..."
               value={filters.search}
               onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
               className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 hover:border-pink-300 text-sm"
             />
           </div>
         </div>
       </div>

             {/* Lista de citas */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="bg-gradient-to-r from-pink-50 to-pink-100 px-4 sm:px-6 py-4 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="p-1.5 sm:p-2 bg-pink-500 rounded-lg shadow-sm">
                 <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
               </div>
               <div>
                 <h3 className="text-base sm:text-lg font-bold text-gray-900">
                   Citas ({filteredAppointments.length})
                 </h3>
                 <p className="text-xs sm:text-sm text-gray-600">
                   Gestiona todas las citas programadas
                 </p>
               </div>
             </div>
           </div>
         </div>

         <div className="divide-y divide-gray-100">
           <AnimatePresence>
             {filteredAppointments.length === 0 ? (
               <div className="p-12 text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <ClockIcon className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
                   No hay citas
                 </h3>
                 <p className="text-gray-600 max-w-md mx-auto">
                   No se encontraron citas con los filtros seleccionados. Intenta ajustar los filtros o crear una nueva cita.
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
                    className="group relative p-4 sm:p-6 hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100 transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-pink-500 hover:shadow-md"
                    onClick={() => setSelectedAppointment(appointment)}
                    title="Click para ver detalles de la cita"
                  >
                    
                                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                     <div className="flex items-center gap-3 sm:gap-6">
                       {/* Status Badge */}
                       <div className="flex-shrink-0">
                         <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border-2 shadow-sm transition-all duration-200 group-hover:scale-105 ${getStatusColor(appointment.status)}`}>
                           {getStatusText(appointment.status)}
                         </span>
                       </div>

                       {/* Cliente Info */}
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-3 sm:gap-4">
                           <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                             <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                           </div>
                           <div className="flex-1">
                             <p className="text-sm sm:text-base font-bold text-gray-900 truncate group-hover:text-pink-700 transition-colors duration-200">
                               {appointment.clientName}
                             </p>
                             <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                               {appointment.clientEmail && (
                                 <span className="flex items-center gap-1 hover:text-pink-600 transition-colors">
                                   <EnvelopeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                   <span className="truncate max-w-24 sm:max-w-32">{appointment.clientEmail}</span>
                                 </span>
                               )}
                               <span className="flex items-center gap-1 hover:text-pink-600 transition-colors">
                                 <PhoneIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                 <span>{appointment.clientPhone}</span>
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>

                       {/* Cita Info */}
                       <div className="hidden md:block">
                         <div className="text-center p-3 bg-gray-50 rounded-lg group-hover:bg-pink-50 transition-colors duration-200">
                           <div className="flex items-center gap-2 mb-1">
                             <ClockIcon className="w-4 h-4 text-pink-500" />
                             <p className="text-sm font-semibold text-gray-900">
                               {format(new Date(appointment.date), 'dd MMM yyyy', { locale: es })}
                             </p>
                           </div>
                           <p className="text-lg font-bold text-pink-600">
                             {format(new Date(appointment.date), 'HH:mm', { locale: es })}
                           </p>
                         </div>
                       </div>

                       {/* Servicios */}
                       <div className="hidden lg:block">
                         <div className="text-center p-3 bg-gray-50 rounded-lg group-hover:bg-pink-50 transition-colors duration-200">
                           <p className="text-sm font-semibold text-gray-900 mb-1">
                             {appointment.service.name}
                           </p>
                                                       <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-bold text-green-600">
                                ${appointment.service.price.toLocaleString()}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                {formatDuration(appointment.service.duration)}
                              </span>
                            </div>
                         </div>
                       </div>
                     </div>

                                                                {/* Actions */}
                     <div className="flex items-center justify-end sm:justify-start gap-2">
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedAppointment(appointment);
                         }}
                         className="inline-flex items-center p-2 sm:p-3 text-gray-400 hover:text-white hover:bg-pink-500 rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg transform hover:scale-105 group-hover:bg-pink-500 group-hover:text-white"
                         title="Ver detalles"
                       >
                         <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                       </button>
                     </div>
                   </div>

                                                        {/* Mobile Info */}
                   <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="text-center p-2 bg-gray-50 rounded-lg">
                           <div className="flex items-center gap-1 mb-1">
                             <ClockIcon className="w-3 h-3 text-pink-500" />
                             <p className="text-xs font-semibold text-gray-900">
                               {format(new Date(appointment.date), 'dd MMM', { locale: es })}
                             </p>
                           </div>
                           <p className="text-sm font-bold text-pink-600">
                             {format(new Date(appointment.date), 'HH:mm', { locale: es })}
                           </p>
                         </div>
                         <div className="text-center p-2 bg-gray-50 rounded-lg">
                           <p className="text-xs font-semibold text-gray-900 mb-1">
                             {appointment.service.name}
                           </p>
                           <div className="flex items-center gap-1 text-xs">
                             <span className="font-bold text-green-600">
                               ${appointment.service.price.toLocaleString()}
                             </span>
                             <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium">
                               {formatDuration(appointment.service.duration)}
                             </span>
                           </div>
                         </div>
                       </div>
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
        onUpdate={() => {}}
      />
    </div>
  );
}
