'use client';

import { useState } from 'react';
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
import { type Appointment, updateAppointment, deleteAppointment } from '@/services/appointment-service';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notes, setNotes] = useState('');

  if (!appointment) return null;

  const handleStatusChange = async (newStatus: Appointment['status']) => {
    try {
      setIsUpdating(true);
      await updateAppointment(appointment.id, { status: newStatus });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado de la cita');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      setIsUpdating(true);
      await updateAppointment(appointment.id, { notes });
      onUpdate();
      alert('Notas actualizadas correctamente');
    } catch (error) {
      console.error('Error actualizando notas:', error);
      alert('Error al actualizar las notas');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(appointment.id);
      onUpdate();
      onClose();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error eliminando cita:', error);
      alert('Error al eliminar la cita');
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
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
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
                            Duración: {appointment.service.duration} minutos
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
                      <p className="text-xs text-gray-600">{appointment.service.duration} minutos</p>
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
                  value={notes || appointment.notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas sobre la cita..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  rows={3}
                />
                {notes !== (appointment.notes || '') && (
                  <button
                    onClick={handleNotesUpdate}
                    disabled={isUpdating}
                    className="mt-2 px-3 py-1 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
                  >
                    Guardar Notas
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200">
              {/* Estado Actions */}
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Cambiar Estado
                </p>
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
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status as Appointment['status'])}
                        disabled={isUpdating}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          isUpdating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-pink-600 text-white hover:bg-pink-700'
                        }`}
                      >
                        {getStatusText(status as Appointment['status'])}
                      </button>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Eliminar
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
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
