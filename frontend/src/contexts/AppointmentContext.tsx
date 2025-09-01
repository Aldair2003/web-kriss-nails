'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getAppointments, type Appointment } from '@/services/appointment-service';

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  refreshAppointments: () => Promise<void>;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
}

interface AppointmentProviderProps {
  children: ReactNode;
}

export function AppointmentProvider({ children }: AppointmentProviderProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar citas iniciales
  const loadAppointments = useCallback(async () => {
    try {
      console.log('🔍 DEBUG AppointmentContext - Iniciando carga de citas...');
      setLoading(true);
      
      console.log('🔍 DEBUG AppointmentContext - Llamando a getAppointments...');
      const response = await getAppointments({ limit: 1000 });
      console.log('🔍 DEBUG AppointmentContext - Respuesta de getAppointments:', response);
      
      const appointmentsList = response?.appointments || [];
      console.log('🔍 DEBUG AppointmentContext - Citas extraídas:', appointmentsList);
      console.log('🔍 DEBUG AppointmentContext - Cantidad de citas:', appointmentsList.length);
      
      setAppointments(appointmentsList);
    } catch (error) {
      console.error('❌ ERROR AppointmentContext - Error cargando citas:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      console.log('🔍 DEBUG AppointmentContext - Carga completada, loading:', false);
    }
  }, []);

  // Recargar citas
  const refreshAppointments = useCallback(async () => {
    await loadAppointments();
  }, [loadAppointments]);

  // Agregar nueva cita
  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [appointment, ...prev]);
  }, []);

  // Actualizar cita existente
  const updateAppointment = useCallback((id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === id ? { ...apt, ...updates } : apt
      )
    );
  }, []);

  // Eliminar cita
  const deleteAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  }, []);

  // Cargar citas al montar el componente
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const value: AppointmentContextType = {
    appointments,
    loading,
    refreshAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}
