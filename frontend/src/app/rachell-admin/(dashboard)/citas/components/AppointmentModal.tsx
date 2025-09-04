'use client';

import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { type Appointment, updateAppointment as updateAppointmentAPI, deleteAppointment as deleteAppointmentAPI } from '@/services/appointment-service';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAppointments } from '@/contexts/AppointmentContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface AppointmentModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function AppointmentModal({
  appointment,
  open,
  onClose,
  onUpdate
}: AppointmentModalProps) {
  
  // Hook del contexto para actualizar el estado local
  const { updateAppointment: updateAppointmentContext, deleteAppointment: deleteAppointmentContext } = useAppointments();
  const { toast } = useToast();
  
  // Mostrar toast informativo cuando se abre el modal
  React.useEffect(() => {
    if (open && appointment) {
      const statusText = getStatusText(appointment.status);
      toast({
        title: '📋 Detalles de Cita',
        description: `Visualizando cita de ${appointment.clientName} - Estado: ${statusText}`,
        variant: 'info',
        duration: 3000
      });
    }
  }, [open, appointment, toast]);
  
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: Appointment['status']) => {
    try {
      setIsUpdating(true);
      // Actualizar en la API
      await updateAppointmentAPI(appointment.id, { status: newStatus });
      // Actualizar en el contexto local inmediatamente
      updateAppointmentContext(appointment.id, { status: newStatus });
      
      // Mostrar toast de éxito específico según el estado
      const statusText = getStatusText(newStatus);
      const getToastConfig = (status: Appointment['status']) => {
        switch (status) {
          case 'CONFIRMED':
            return {
              title: '✅ Cita Confirmada',
              description: `La cita de ${appointment.clientName} ha sido confirmada exitosamente`,
              variant: 'success' as const,
              duration: 4000
            };
          case 'COMPLETED':
            return {
              title: '🎉 Cita Completada',
              description: `¡Excelente! La cita de ${appointment.clientName} ha sido completada`,
              variant: 'success' as const,
              duration: 5000
            };
          case 'CANCELLED':
            return {
              title: '❌ Cita Cancelada',
              description: `La cita de ${appointment.clientName} ha sido cancelada`,
              variant: 'destructive' as const,
              duration: 4000
            };
          default:
            return {
              title: '✅ Estado Actualizado',
              description: `La cita de ${appointment.clientName} ha sido marcada como ${statusText.toLowerCase()}`,
              variant: 'success' as const,
              duration: 4000
            };
        }
      };
      
      const toastConfig = getToastConfig(newStatus);
      toast(toastConfig);
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      // Mostrar toast de error
      toast({
        title: '❌ Error',
        description: 'No se pudo actualizar el estado de la cita. Intenta nuevamente.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsUpdating(false);
    }
  };



  const handleDelete = async () => {
    try {
      // Eliminar en la API
      await deleteAppointmentAPI(appointment.id);
      // Eliminar del contexto local inmediatamente
      deleteAppointmentContext(appointment.id);
      
      // Mostrar toast de éxito
      toast({
        title: '🗑️ Cita Eliminada',
        description: `La cita de ${appointment.clientName} ha sido eliminada exitosamente`,
        variant: 'success',
        duration: 4000
      });
      
      onUpdate();
      onClose();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error eliminando cita:', error);
      // Mostrar toast de error
      toast({
        title: '❌ Error',
        description: 'No se pudo eliminar la cita. Intenta nuevamente.',
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <>
      <Dialog open={open} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-10">
          <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Detalles de la Cita
                </Dialog.Title>
                <p className="text-sm text-gray-600 mt-1">
                  ID: {appointment.id.slice(0, 8)}...
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Estado actual */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Estado Actual
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                    {getStatusText(appointment.status)}
                  </span>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Creada</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(appointment.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Información de la cita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Información de la Cita
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(appointment.date), 'EEEE, d MMMM yyyy', { locale: es })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(appointment.date), 'HH:mm', { locale: es })} - {format(new Date(new Date(appointment.date).getTime() + (appointment.service.duration * 60000)), 'HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Duración: {formatDuration(appointment.service.duration)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: ${appointment.service.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Información del Cliente
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-900">{appointment.clientName}</span>
                      </div>
                      
                      {appointment.clientEmail && (
                        <div className="flex items-center gap-3">
                          <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                          <a 
                            href={`mailto:${appointment.clientEmail}`}
                            className="text-sm text-pink-600 hover:text-pink-700"
                          >
                            {appointment.clientEmail}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                        <a 
                          href={`tel:${appointment.clientPhone}`}
                          className="text-sm text-pink-600 hover:text-pink-700"
                        >
                          {appointment.clientPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Servicios */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Servicios Solicitados
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{appointment.service.name}</p>
                      <p className="text-xs text-gray-600">{formatDuration(appointment.service.duration)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ${appointment.service.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Notas
                </h3>
                <textarea
                  value={appointment.notes || ''}
                  placeholder="Agregar notas sobre la cita..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                  readOnly
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200">
              {/* Estado Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Cambiar Estado
                  </p>
                  {isUpdating && (
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-primary-600 rounded-full animate-spin"></div>
                      <span className="text-xs text-gray-500">Actualizando...</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* ✅ Solo mostrar transiciones válidas */}
                  {(() => {
                    const currentStatus = appointment.status;
                    const validTransitions: Record<string, string[]> = {
                      'PENDING': ['CONFIRMED', 'CANCELLED'],
                      'CONFIRMED': ['COMPLETED', 'CANCELLED'],
                      'COMPLETED': [], // Estado final
                      'CANCELLED': []  // Estado final
                    };

                    return validTransitions[currentStatus].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(status as Appointment['status'])}
                        disabled={isUpdating}
                        className={`${
                          isUpdating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                            : 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
                        }`}
                      >
                        {getStatusText(status as Appointment['status'])}
                      </Button>
                    ));
                  })()}
                  
                  {/* Mostrar mensaje si no hay transiciones válidas */}
                  {(() => {
                    const currentStatus = appointment.status;
                    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
                      return (
                        <span className="text-xs text-gray-500 italic">
                          {currentStatus === 'COMPLETED' 
                            ? 'Cita completada - No se puede modificar' 
                            : 'Cita cancelada - No se puede modificar'
                          }
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 text-red-700 bg-red-50 border-red-200 hover:bg-red-100"
                >
                  <TrashIcon className="w-4 h-4" />
                  Eliminar
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar Cita"
        message={`¿Estás seguro de que quieres eliminar la cita de ${appointment.clientName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  );
}
