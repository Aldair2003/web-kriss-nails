'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BellIcon, 
  ChevronRightIcon,
  CalendarIcon,
  StarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { getAppointments } from '@/services/appointment-service'
import { getAllReviews } from '@/services/review-service'
import { format, isToday, isTomorrow, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'appointment' | 'review' | 'reminder' | 'alert'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  action?: {
    label: string
    url: string
  }
  timestamp: Date
}

interface NotificationsCardProps {
  className?: string
}

export default function NotificationsCard({ className }: NotificationsCardProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        
        const [appointmentsData, reviewsData] = await Promise.all([
          getAppointments({ limit: 100 }),
          getAllReviews()
        ])

        const newNotifications: Notification[] = []
        const today = new Date()

        // Citas próximas
        const citasProximas = appointmentsData.appointments.filter(apt => {
          const aptDate = new Date(apt.date)
          return (isToday(aptDate) || isTomorrow(aptDate)) && 
                 apt.status === 'CONFIRMED'
        })

        citasProximas.forEach(cita => {
          const aptDate = new Date(cita.date)
          const isTodayAppointment = isToday(aptDate)
          
          newNotifications.push({
            id: `appointment-${cita.id}`,
            type: 'appointment',
            title: isTodayAppointment ? 'Cita hoy' : 'Cita mañana',
            message: `${cita.clientName} - ${cita.service.name} a las ${format(aptDate, 'HH:mm')}`,
            priority: isTodayAppointment ? 'high' : 'medium',
            action: {
              label: 'Ver detalles',
              url: '/rachell-admin/citas'
            },
            timestamp: aptDate
          })
        })

        // Reseñas nuevas
        const reseñasRecientes = reviewsData.filter(review => {
          const reviewDate = new Date(review.createdAt)
          const yesterday = addDays(today, -1)
          return reviewDate >= yesterday && !review.isRead
        })

        reseñasRecientes.forEach(review => {
          newNotifications.push({
            id: `review-${review.id}`,
            type: 'review',
            title: 'Nueva reseña',
            message: `${review.clientName} dejó una reseña de ${review.rating} estrellas`,
            priority: 'medium',
            action: {
              label: 'Ver reseña',
              url: '/rachell-admin/resenas'
            },
            timestamp: new Date(review.createdAt)
          })
        })

        // Citas pendientes
        const citasPendientes = appointmentsData.appointments.filter(apt => 
          apt.status === 'PENDING'
        )

        if (citasPendientes.length > 0) {
          newNotifications.push({
            id: 'pending-appointments',
            type: 'alert',
            title: 'Citas pendientes',
            message: `${citasPendientes.length} cita${citasPendientes.length !== 1 ? 's' : ''} sin confirmar`,
            priority: 'high',
            action: {
              label: 'Confirmar',
              url: '/rachell-admin/citas'
            },
            timestamp: today
          })
        }

        newNotifications.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          return b.timestamp.getTime() - a.timestamp.getTime()
        })

        setNotifications(newNotifications.slice(0, 5))
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <CalendarIcon className="w-4 h-4" />
      case 'review':
        return <StarIcon className="w-4 h-4" />
      case 'reminder':
        return <BellIcon className="w-4 h-4" />
      case 'alert':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      default:
        return <BellIcon className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityIconColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <BellIcon className="w-5 h-5 mr-2 text-primary-600" />
            <span className="font-semibold text-lg">Notificaciones</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BellIcon className="w-5 h-5 mr-2 text-primary-600" />
            <span className="font-semibold text-lg">Notificaciones</span>
          </div>
          {notifications.length > 0 && (
            <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs">
              {notifications.length}
            </span>
          )}
        </div>
        
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm ${getPriorityColor(notification.priority)}`}
                onClick={() => {
                  if (notification.action) {
                    window.location.href = notification.action.url
                  }
                }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)} ${getPriorityIconColor(notification.priority)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(notification.timestamp, "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  {notification.action && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircleIcon className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500">Todo está al día</p>
            <p className="text-sm text-gray-400 mt-1">No hay notificaciones pendientes</p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button 
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => {
              window.location.href = '/rachell-admin/citas'
            }}
          >
            Ver todas las actividades
            <ChevronRightIcon className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </div>
    </div>
  )
}
