'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { getAppointments } from '@/services/appointment-service';

interface Stats {
  today: number;
  pending: number;
  confirmed: number;
  completed: number;
}

export function AppointmentStats() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        
        // Obtener todas las citas
        const allAppointments = await getAppointments({ limit: 1000 });
        const appointments = allAppointments?.appointments || [];
        
        // Calcular estadísticas
        const today = new Date().toISOString().split('T')[0];
        
        const todayCount = appointments.filter(apt => 
          apt.date.split('T')[0] === today
        ).length;
        
        const pendingCount = appointments.filter(apt => 
          apt.status === 'PENDING'
        ).length;
        
        const confirmedCount = appointments.filter(apt => 
          apt.status === 'CONFIRMED'
        ).length;
        
        const completedCount = appointments.filter(apt => 
          apt.status === 'COMPLETED'
        ).length;
        
        setStats({
          today: todayCount,
          pending: pendingCount,
          confirmed: confirmedCount,
          completed: completedCount
        });
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Citas Hoy',
      value: stats.today,
      icon: CalendarDaysIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      title: 'Pendientes',
      value: stats.pending,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    },
    {
      title: 'Confirmadas',
      value: stats.confirmed,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    {
      title: 'Completadas',
      value: stats.completed,
      icon: ExclamationTriangleIcon,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.border} border`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
