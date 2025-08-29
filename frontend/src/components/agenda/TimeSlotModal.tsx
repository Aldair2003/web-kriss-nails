'use client';

import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { type AvailableSlot } from '@/services/appointment-service';

interface TimeSlotModalProps {
  open: boolean;
  date: Date | null;
  slots: AvailableSlot[];
  loading: boolean;
  onClose: () => void;
  onSelectSlot: (slot: AvailableSlot) => void;
}

export function TimeSlotModal({
  open,
  date,
  slots,
  loading,
  onClose,
  onSelectSlot
}: TimeSlotModalProps) {
  if (!date) return null;

  const availableSlots = slots.filter(slot => slot.available);
  const occupiedSlots = slots.filter(slot => !slot.available);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Horarios Disponibles
              </Dialog.Title>
              <p className="text-sm text-gray-600 mt-1">
                {format(date, 'EEEE, d MMMM yyyy', { locale: es })}
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
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                  <span className="text-gray-600">Cargando horarios...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horarios disponibles */}
                {availableSlots.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Horarios Disponibles
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => onSelectSlot(slot)}
                          className="p-3 border-2 border-green-200 bg-green-50 rounded-lg hover:bg-green-100 hover:border-green-300 transition-all text-center group"
                        >
                          <div className="flex flex-col items-center gap-1 text-green-700">
                            <ClockIcon className="w-4 h-4" />
                            <span className="font-medium text-sm">
                              {slot.startTime}
                            </span>
                            <span className="text-xs">
                              {slot.endTime}
                            </span>
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Disponible
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay horarios disponibles
                    </h3>
                    <p className="text-gray-600">
                      Lo sentimos, no hay horarios disponibles para esta fecha.
                      Por favor selecciona otra fecha.
                    </p>
                  </div>
                )}

                {/* Horarios ocupados (informativo) */}
                {occupiedSlots.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Horarios Ocupados
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {occupiedSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="p-3 border-2 border-red-200 bg-red-50 rounded-lg text-center"
                        >
                          <div className="flex flex-col items-center gap-1 text-red-700">
                            <ClockIcon className="w-4 h-4" />
                            <span className="font-medium text-sm">
                              {slot.startTime}
                            </span>
                            <span className="text-xs">
                              {slot.endTime}
                            </span>
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            Ocupado
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
