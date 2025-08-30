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
      setLoading(true);
      const response = await getAppointments({ limit: 1000 });
      setAppointments(response?.appointments || []);
    } catch (error) {
      console.error('Error cargando citas:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
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
