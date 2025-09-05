'use client';

import { useState } from 'react';
import { AvailabilityManager } from './components/AvailabilityManager';
import { PublicHoursManager } from './components/PublicHoursManager';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function HorariosPage() {
  const [activeTab, setActiveTab] = useState<'dias' | 'horarios' | 'preview'>('dias');

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 pt-3 sm:pt-1 pb-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <ClockIcon className="w-8 h-8 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Horarios Públicos</h1>
        </div>
        <p className="text-gray-600">
          Configura los días y horarios disponibles para que los clientes puedan agendar citas
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('dias')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dias'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                Días Habilitados
              </div>
            </button>
            <button
              onClick={() => setActiveTab('horarios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'horarios'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                Horarios Específicos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 border-b-2 font-medium text-base sm:text-sm ${
                activeTab === 'preview'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <EyeIcon className="w-5 h-5 sm:w-4 sm:h-4" />
                Vista Cliente
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'dias' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarDaysIcon className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-900">Gestionar Días Habilitados</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Habilita o deshabilita días para que los clientes puedan agendar citas. 
              Los días habilitados aparecerán como disponibles en el calendario público.
            </p>
            <AvailabilityManager onAvailabilityChange={() => {}} />
          </div>
        )}

        {activeTab === 'horarios' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-900">Configurar Horarios Específicos</h2>
            </div>
            <PublicHoursManager />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <EyeIcon className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-900">Vista Cliente</h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 mb-1">Estado Actual</h3>
                  <p className="text-green-700 text-sm">
                    Los clientes pueden ver y agendar en todos los días que hayas habilitado en la pestaña "Días Habilitados".
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center py-12">
              <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Vista Previa</h3>
              <p className="text-gray-500 mb-4">
                Aquí podrás ver exactamente cómo ven los clientes tu disponibilidad.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="font-medium text-gray-700 mb-2">Próximamente:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Simulación del calendario cliente</li>
                  <li>• Horarios específicos por día</li>
                  <li>• Estados de disponibilidad</li>
                  <li>• Validación de reservas</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
