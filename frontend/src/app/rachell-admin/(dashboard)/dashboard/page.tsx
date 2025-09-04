'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { format, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { 
  CalendarIcon, 
  StarIcon, 
  PhotoIcon, 
  ClockIcon, 
  UserIcon,
  ChevronRightIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { getPendingReviewsCount, getUnreadReviewsCount, getAllReviews } from '@/services/review-service'
import { getAppointments, type Appointment, updateAppointment } from '@/services/appointment-service'
import { getActiveServices } from '@/services/service-service'
import { getImages } from '@/services/image-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import TopPerformersCard from '@/app/rachell-admin/(dashboard)/dashboard/TopPerformersCard'
import NotificationsCard from '@/app/rachell-admin/(dashboard)/dashboard/NotificationsCard'
import TrendChart from '@/app/rachell-admin/(dashboard)/dashboard/TrendChart'
import IncomeSummaryCard from '@/app/rachell-admin/(dashboard)/dashboard/components/IncomeSummaryCard'
import IncomeChart from '@/app/rachell-admin/(dashboard)/dashboard/components/IncomeChart'
import TopServicesChart from '@/app/rachell-admin/(dashboard)/dashboard/components/TopServicesChart'
import WeeklyIncomeChart from '@/app/rachell-admin/(dashboard)/dashboard/components/WeeklyIncomeChart'
import IncomeHistoryCard from '@/app/rachell-admin/(dashboard)/dashboard/components/IncomeHistoryCard'

// Interfaces para el Dashboard
interface DashboardStats {
  citasHoy: number
  citasManana: number
  citasConfirmadas: number
  citasPendientes: number
  servicios: number
  resenas: number
  resenasPendientes: number
  resenasNoLeidas: number
  fotos: number
  ingresosMes: number
}

interface DashboardAppointment {
  id: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  service: {
    name: string
    price: number
  }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    citasHoy: 0,
    citasManana: 0,
    citasConfirmadas: 0,
    citasPendientes: 0,
    servicios: 0,
    resenas: 0,
    resenasPendientes: 0,
    resenasNoLeidas: 0,
    fotos: 0,
    ingresosMes: 0
  })
  const [proximasCitas, setProximasCitas] = useState<DashboardAppointment[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [selectedCita, setSelectedCita] = useState<DashboardAppointment | null>(null)
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/rachell-admin/login')
    }
    
    if (user) {
      loadDashboardData(false)
    }
  }, [user, loading, router])

  // Debug para ver los stats
  useEffect(() => {
    console.log('🔍 Stats en render:', { 
      citasHoy: stats.citasHoy, 
      citasManana: stats.citasManana, 
      citasPendientes: stats.citasPendientes 
    })
  }, [stats.citasHoy, stats.citasManana, stats.citasPendientes])

  // Actualización automática cada 5 minutos
  useEffect(() => {
    if (!user) return

          // Configurar intervalo de actualización automática
      const interval = setInterval(() => {
        console.log('🔄 Actualizando datos del dashboard automáticamente...')
        loadDashboardData(false)
        
        // Verificar si hay citas importantes para notificar
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const citasHoy = proximasCitas.filter(cita => {
          const citaDate = new Date(cita.date)
          return citaDate.toDateString() === today.toDateString()
        })
        
        const citasManana = proximasCitas.filter(cita => {
          const citaDate = new Date(cita.date)
          return citaDate.toDateString() === tomorrow.toDateString()
        })
        
        const citasPendientes = proximasCitas.filter(cita => cita.status === 'PENDING')
        
        // Mostrar notificación solo si hay citas importantes
        if (citasHoy.length > 0 || citasManana.length > 0 || citasPendientes.length > 0) {
          let mensaje = ''
          if (citasHoy.length > 0) {
            mensaje += `${citasHoy.length} cita${citasHoy.length > 1 ? 's' : ''} hoy`
          }
          if (citasManana.length > 0) {
            if (mensaje) mensaje += ', '
            mensaje += `${citasManana.length} cita${citasManana.length > 1 ? 's' : ''} mañana`
          }
          if (citasPendientes.length > 0) {
            if (mensaje) mensaje += ', '
            mensaje += `${citasPendientes.length} pendiente${citasPendientes.length > 1 ? 's' : ''} de confirmar`
          }
          
          toast({
            title: '📅 Citas Importantes',
            description: mensaje,
            variant: 'info',
            duration: 4000
          })
        } else {
          // Toast silencioso para actualización automática
          toast({
            description: 'Datos actualizados automáticamente',
            variant: 'info',
            duration: 2000
          })
        }
      }, 5 * 60 * 1000) // 5 minutos

    // Limpiar intervalo cuando el componente se desmonte
    return () => clearInterval(interval)
  }, [user])

  const loadDashboardData = async (showToast = false) => {
    try {
      setLoadingStats(true)
      
      // Cargar datos en paralelo
      const [
        appointmentsData,
        reviewsPending,
        reviewsUnread,
        servicesData,
        allReviews,
        allImages
      ] = await Promise.all([
        getAppointments({ limit: 100 }), // Obtener citas para calcular estadísticas
        getPendingReviewsCount(),
        getUnreadReviewsCount(),
        getActiveServices(),
        getAllReviews(),
        getImages({ isActive: true })
      ])

      // Procesar citas
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const citasHoy = appointmentsData.appointments.filter(apt => 
        isToday(new Date(apt.date))
      )
      
      const citasManana = appointmentsData.appointments.filter(apt => {
        const aptDate = new Date(apt.date)
        return aptDate.toDateString() === tomorrow.toDateString()
      })
      
      const citasConfirmadas = citasHoy.filter(apt => apt.status === 'CONFIRMED').length
      const citasPendientes = appointmentsData.appointments.filter(apt => apt.status === 'PENDING').length
      
      console.log('🔍 Debug citas:', {
        total: appointmentsData.appointments.length,
        hoy: citasHoy.length,
        manana: citasManana.length,
        pendientes: citasPendientes,
        tomorrow: tomorrow.toDateString(),
        citasManana: citasManana.map(c => ({ date: c.date, name: c.clientName })),
        citasPendientes: appointmentsData.appointments
          .filter(apt => apt.status === 'PENDING')
          .map(c => ({ date: c.date, name: c.clientName, notes: c.notes }))
      })

      // Calcular ingresos del mes (simplificado)
      const citasDelMes = appointmentsData.appointments.filter(apt => {
        const aptDate = new Date(apt.date)
        return aptDate.getMonth() === today.getMonth() && 
               aptDate.getFullYear() === today.getFullYear() &&
               apt.status === 'COMPLETED'
      })
      
      const ingresosMes = citasDelMes.reduce((total, apt) => 
        total + Number(apt.service.price), 0
      )

      // Obtener próximas citas (próximos 7 días)
      const proximas = appointmentsData.appointments
        .filter(apt => {
          const aptDate = new Date(apt.date)
          const today = new Date()
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 días
          
          return aptDate >= today && 
                 aptDate <= nextWeek && 
                 apt.status !== 'CANCELLED'
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5)

      setStats({
        citasHoy: citasHoy.length,
        citasManana: citasManana.length,
        citasConfirmadas,
        citasPendientes,
        servicios: servicesData.length,
        resenas: allReviews.length,
        resenasPendientes: reviewsPending,
        resenasNoLeidas: reviewsUnread,
        fotos: allImages.length,
        ingresosMes
      })

      setProximasCitas(proximas)
      setLastUpdate(new Date()) // Registrar la última actualización
      
      // Mostrar toast si es actualización manual
      if (showToast) {
        toast({
          title: '¡Actualizado!',
          description: 'Datos del dashboard actualizados correctamente',
          variant: 'success',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
      
      // Mostrar toast de error si es actualización manual
      if (showToast) {
        toast({
          title: 'Error',
          description: 'Error al actualizar los datos del dashboard',
          variant: 'destructive',
          duration: 3000
        })
      }
    } finally {
      setLoadingStats(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'CONFIRMADA'
      case 'PENDING':
        return 'PENDIENTE'
      case 'CANCELLED':
        return 'CANCELADA'
      case 'COMPLETED':
        return 'COMPLETADA'
      default:
        return status
    }
  }

  const handleViewCita = (cita: DashboardAppointment) => {
    console.log('🔍 Cita seleccionada:', {
      id: cita.id,
      name: cita.clientName,
      notes: cita.notes,
      hasNotes: !!cita.notes
    })
    setSelectedCita(cita)
    setShowCitaModal(true)
  }

  const handleCallClient = (phoneNumber: string) => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      window.location.href = `tel:${phoneNumber}`
    }
  }

  const handleWhatsAppClient = (phoneNumber: string) => {
    if (typeof window !== 'undefined') {
      // Formatear el número para WhatsApp (remover espacios, guiones, etc.)
      const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/-/g, '').replace(/\(/g, '').replace(/\)/g, '')
      // Agregar código de país si no tiene (asumiendo Ecuador +593)
      const formattedPhone = cleanPhone.startsWith('593') ? cleanPhone : `593${cleanPhone.replace(/^0/, '')}`
      
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=Hola! Te escribo desde Kriss Beauty Nails.`
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleEditCita = (citaId: string) => {
    router.push(`/rachell-admin/citas`)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedCita) return

    try {
      setIsUpdating(true)
      console.log('🔄 Iniciando actualización de estado:', { citaId: selectedCita.id, newStatus })
      
      // Actualizar en la API usando el servicio correcto
      const updatedAppointment = await updateAppointment(selectedCita.id, { status: newStatus as any })
      console.log('✅ Cita actualizada exitosamente:', updatedAppointment)
      
      // Actualizar el estado local
      setSelectedCita(prev => prev ? { ...prev, status: newStatus as any } : null)
      
      // Recargar datos del dashboard
      await loadDashboardData(false)
      
      // Mostrar mensaje de éxito
      toast({
        title: '¡Éxito!',
        description: 'Estado actualizado correctamente',
        variant: 'success',
        duration: 3000
      })
      
    } catch (error) {
      console.error('❌ Error actualizando estado:', error)
      
      // Mostrar mensaje de error más específico
      let errorMessage = 'Error al actualizar el estado de la cita'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header de Bienvenida */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              Buenos días, {user.name}
        </h2>
        <p className="text-gray-600 mt-2 flex items-center text-sm sm:text-base">
          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
            {(stats.citasHoy > 0 || stats.citasManana > 0 || stats.citasPendientes > 0) && (
              <p className="text-primary-600 mt-2 font-medium">
                {stats.citasHoy > 0 && `Tienes ${stats.citasHoy} cita${stats.citasHoy !== 1 ? 's' : ''} hoy`}
                {stats.citasManana > 0 && `${stats.citasHoy > 0 ? ', ' : ''}${stats.citasManana} cita${stats.citasManana !== 1 ? 's' : ''} mañana`}
                {stats.citasPendientes > 0 && `${(stats.citasHoy > 0 || stats.citasManana > 0) ? ', ' : ''}${stats.citasPendientes} pendiente${stats.citasPendientes !== 1 ? 's' : ''} de confirmar`}
              </p>
            )}
            {lastUpdate && (
              <p className="text-gray-500 mt-1 text-xs">
                Última actualización: {format(lastUpdate, "HH:mm", { locale: es })}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={loadingStats}
            className="flex-shrink-0"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
      </div>
      </motion.div>

      {/* Métricas Principales */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {/* Citas de Hoy */}
        <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer" 
              onClick={() => router.push('/rachell-admin/citas')}>
          <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Citas de Hoy</h3>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 group-hover:scale-105 transition-transform">
                  {loadingStats ? '...' : stats.citasHoy}
              </p>
            </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">
              {stats.citasConfirmadas} confirmadas, {stats.citasPendientes} pendientes
            </p>
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer"
              onClick={() => router.push('/rachell-admin/servicios')}>
          <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Servicios</h3>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 group-hover:scale-105 transition-transform">
                  {loadingStats ? '...' : stats.servicios}
              </p>
            </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                <Image
                  src="/icon/manicureicon1.png"
                  alt="Servicios"
                  fill
                  sizes="(max-width: 640px) 20px, (max-width: 768px) 24px, 24px"
                  className="object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(37%) sepia(93%) saturate(7471%) hue-rotate(330deg) brightness(91%) contrast(101%)'
                  }}
                />
              </div>
            </div>
          </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">Servicios activos</p>
          </CardContent>
        </Card>

        {/* Reseñas */}
        <Link href="/rachell-admin/resenas">
          <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer">
            <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Reseñas</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600 group-hover:scale-105 transition-transform">
                    {loadingStats ? '...' : stats.resenas}
              </p>
            </div>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-2 flex items-center justify-between">
            <span>4.8 calificación promedio</span>
            {stats.resenasPendientes > 0 && (
                  <span className="text-primary-600 font-medium flex items-center">
                {stats.resenasPendientes} pendiente{stats.resenasPendientes !== 1 && 's'}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </span>
            )}
          </div>
            </CardContent>
          </Card>
        </Link>

        {/* Galería */}
        <Link href="/rachell-admin/galeria">
          <Card className="hover:shadow-md transition-all duration-200 group cursor-pointer">
            <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Galería</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-600 group-hover:scale-105 transition-transform">
                    {loadingStats ? '...' : stats.fotos}
              </p>
            </div>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            </div>
          </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">Fotos en galería</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Próximas Citas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="flex flex-col">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
                  Próximas Citas
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Auto</span>
                  </div>
                  {lastUpdate && (
                    <span className="text-xs text-gray-400">
                      {format(lastUpdate, "HH:mm", { locale: es })}
                    </span>
                  )}
        </div>
      </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 flex-1 flex flex-col">
              {loadingStats ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
                  ))}
          </div>
              ) : proximasCitas.length > 0 ? (
                <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                  {proximasCitas.map((cita) => (
                    <motion.div 
                key={cita.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 space-y-1 sm:space-y-0">
                          <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors text-sm sm:text-base">
                            {cita.clientName}
                          </p>
                          <span className={`px-2 py-1 text-xs rounded-full transition-colors whitespace-nowrap border ${getStatusColor(cita.status)} self-start sm:self-auto`}>
                            {getStatusText(cita.status)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate mb-1">{cita.service.name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                          <p className="text-xs text-gray-400 flex items-center">
                            <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            {format(new Date(cita.date), "d MMM, HH:mm", { locale: es })}
                          </p>
                          {cita.clientPhone && (
                            <p className="text-xs text-gray-400 flex items-center">
                              <PhoneIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                              {cita.clientPhone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end sm:justify-start gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0 bg-blue-50 hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewCita(cita)
                          }}
                        >
                          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </Button>
                        {cita.clientPhone && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 sm:h-9 sm:w-9 p-0 bg-green-50 hover:bg-green-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleWhatsAppClient(cita.clientPhone)
                            }}
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 flex-1 flex flex-col justify-center">
                  <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No hay citas programadas</p>
                  <Button 
                    className="mt-3 sm:mt-4"
                    size="sm"
                    onClick={() => router.push('/rachell-admin/citas')}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Crear Cita
                  </Button>
                </div>
              )}
              
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/rachell-admin/citas')}
                >
                  Ver todas las citas
                  <ChevronRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Panel Lateral - AL MISMO NIVEL */}
                  <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Acciones Rápidas - PRIMERO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={() => router.push('/rachell-admin/citas')}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nueva Cita
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/rachell-admin/galeria')}
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  Subir Foto
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/rachell-admin/resenas')}
                >
                  <StarIcon className="w-4 h-4 mr-2" />
                  Ver Reseñas
                  {stats.resenasPendientes > 0 && (
                    <span className="ml-auto bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs">
                      {stats.resenasPendientes}
                    </span>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/rachell-admin/servicios')}
                >
                  <div className="relative w-4 h-4 mr-2">
                    <Image
                      src="/icon/manicureicon1.png"
                      alt="Servicios"
                      fill
                      sizes="16px"
                      className="object-contain"
                      style={{
                        filter: 'brightness(0) saturate(100%) invert(37%) sepia(93%) saturate(7471%) hue-rotate(330deg) brightness(91%) contrast(101%)'
                      }}
                    />
                  </div>
                  Gestionar Servicios
                </Button>
              </CardContent>
            </Card>

            {/* Resumen del Mes - SEGUNDO */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Resumen del Mes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ingresos</span>
                    <span className="font-semibold text-green-600">
                      ${loadingStats ? '...' : parseFloat(String(stats.ingresosMes)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Citas completadas</span>
                    <span className="font-semibold text-gray-900">
                      {loadingStats ? '...' : parseFloat(String(stats.ingresosMes / 25)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Promedio por cita</span>
                    <span className="font-semibold text-gray-900">
                      ${loadingStats ? '...' : parseFloat(String(stats.ingresosMes / Math.max(1, Math.floor(stats.ingresosMes / 25)))).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Separador visual */}
                  <div className="border-t border-gray-100 my-3"></div>
                  
                  {/* Métricas adicionales */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Meta mensual</span>
                      <span className="text-sm text-gray-500">$1,000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((stats.ingresosMes / 1000) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  

                                  </div>
                  
                  {/* Espacio adicional sutil para alineación perfecta */}
                  <div className="pt-5">
                    <div className="text-center">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardContent>
            </Card>

            {/* Alertas Urgentes - TERCERO (Movido arriba) */}
            {(stats.citasPendientes > 0 || stats.resenasPendientes > 0) && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg text-yellow-800">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    Acciones Requeridas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.citasPendientes > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-yellow-800">
                          {stats.citasPendientes} cita{stats.citasPendientes !== 1 ? 's' : ''} sin confirmar
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/rachell-admin/citas')}
                      >
                        Ver
                      </Button>
                    </div>
                  )}
                  
                  {stats.resenasPendientes > 0 && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-yellow-800">
                          {stats.resenasPendientes} reseña{stats.resenasPendientes !== 1 ? 's' : ''} pendiente{stats.resenasPendientes !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push('/rachell-admin/resenas')}
                      >
                        Ver
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


          </motion.div>

        {/* Servicios Más Populares y Notificaciones - ABAJO DE PRÓXIMAS CITAS */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-3"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Servicios Más Populares */}
            <TopPerformersCard />
            
            {/* Notificaciones */}
            <NotificationsCard />
          </div>
        </motion.div>

        {/* Gráfico de Tendencias - ABAJO */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-3"
        >
          <TrendChart />
        </motion.div>
      </div>

      {/* Sección Financiera */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Análisis Financiero</h2>
        </div>

        {/* Gráficos Financieros */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Primera fila - Resúmenes principales */}
          <div className="lg:col-span-3">
            <div className="h-full">
              <IncomeSummaryCard />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-full">
              <IncomeHistoryCard />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-full">
              <WeeklyIncomeChart />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-full">
              <TopServicesChart />
            </div>
          </div>
          
          {/* Segunda fila - Gráfico grande de tendencias */}
          <div className="lg:col-span-12">
            <IncomeChart />
          </div>
        </div>
      </motion.div>

      {/* Modal de Detalles de Cita */}
      <Dialog open={showCitaModal} onOpenChange={setShowCitaModal}>
        <DialogContent className="w-[95%] max-w-md sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-white rounded-lg">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
              Detalles de la Cita
            </DialogTitle>
            {selectedCita && (
              <p className="text-sm text-gray-600 mt-1">
                ID: {selectedCita.id.slice(0, 8)}...
              </p>
            )}
          </DialogHeader>
          
          {selectedCita && (
            <div className="space-y-4 sm:space-y-6">
              {/* Estado actual */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Estado Actual
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedCita.status)}`}>
                    {getStatusText(selectedCita.status)}
                  </span>
                </div>
                
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">Creada</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(selectedCita.date), 'dd MMM yyyy, HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Información de la cita */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Información de la Cita
                    </h3>
                    
                                          <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-3">
                          <ClockIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {format(new Date(selectedCita.date), 'EEEE, d MMMM yyyy', { locale: es })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(selectedCita.date), 'HH:mm', { locale: es })} - {format(new Date(new Date(selectedCita.date).getTime() + (60 * 60000)), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Duración: 1h
                            </p>
                            <p className="text-sm text-gray-600">
                              Total: ${selectedCita.service.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Información del Cliente
                    </h3>
                    
                                          <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900">{selectedCita.clientName}</span>
                        </div>
                        
                        {selectedCita.clientEmail && (
                          <div className="flex items-center gap-3">
                            <EnvelopeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <a 
                              href={`mailto:${selectedCita.clientEmail}`}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              {selectedCita.clientEmail}
                            </a>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <a 
                            href={`tel:${selectedCita.clientPhone}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            {selectedCita.clientPhone}
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
                        <p className="text-sm font-medium text-gray-900">{selectedCita.service.name}</p>
                        <p className="text-xs text-gray-600">1h</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${selectedCita.service.price.toLocaleString()}
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
                    value={selectedCita.notes || ''}
                    placeholder="Agregar notas sobre la cita..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={3}
                    readOnly
                  />
                </div>

                {/* Cambiar Estado */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Cambiar Estado
                    </h3>
                    {isUpdating && (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-primary-600 rounded-full animate-spin"></div>
                        <span className="text-xs text-gray-500">Actualizando...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const currentStatus = selectedCita.status;
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
                          onClick={() => handleStatusChange(status)}
                          disabled={isUpdating}
                          className={`${
                            isUpdating
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
                          }`}
                        >
                          {getStatusText(status)}
                        </Button>
                      ));
                    })()}
                    
                    {(() => {
                      const currentStatus = selectedCita.status;
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

                {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex gap-2 w-full">
                  {selectedCita.clientPhone && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleWhatsAppClient(selectedCita.clientPhone)}
                      disabled={isUpdating}
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCitaModal(false)
                      router.push('/rachell-admin/citas')
                    }}
                    disabled={isUpdating}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Ir a Citas
                  </Button>
          </div>
        </div>
      </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 