'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AreaChart } from '@tremor/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'
import { 
  CalendarIcon, 
  StarIcon, 
  PhotoIcon, 
  ClockIcon, 
  UserIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { getPendingReviewsCount } from '@/services/review-service'

// Datos de ejemplo - En producción estos vendrían de tu API
const chartdata = [
  { date: '2024-01', citas: 12, reseñas: 4 },
  { date: '2024-02', citas: 18, reseñas: 7 },
  { date: '2024-03', citas: 25, reseñas: 10 },
]

const citasRecientes = [
  { id: 1, cliente: 'María González', servicio: 'Manicure Completo', fecha: '2024-03-25 14:00', estado: 'pendiente' },
  { id: 2, cliente: 'Ana López', servicio: 'Pedicure Spa', fecha: '2024-03-25 15:30', estado: 'confirmada' },
  { id: 3, cliente: 'Laura Torres', servicio: 'Uñas Acrílicas', fecha: '2024-03-26 10:00', estado: 'pendiente' },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    citasHoy: 5,
    servicios: 12,
    resenas: 28,
    resenasPendientes: 0,
    fotos: 45
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/rachell-admin/login')
    }
    
    // Cargar estadísticas de reseñas
    const fetchReviewStats = async () => {
      try {
        const pendingCount = await getPendingReviewsCount();
        setStats(prev => ({
          ...prev,
          resenasPendientes: pendingCount
        }));
      } catch (error) {
        console.error('Error al obtener estadísticas de reseñas:', error);
      }
    };
    
    if (user) {
      fetchReviewStats();
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Bienvenida */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
          Bienvenida, {user.name}
        </h2>
        <p className="text-gray-600 mt-2 flex items-center text-sm sm:text-base">
          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:border-pink-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Citas de Hoy</h3>
              <p className="text-2xl sm:text-3xl font-bold text-pink-600 group-hover:scale-105 transition-transform">
                {stats.citasHoy}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">3 confirmadas, 2 pendientes</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:border-pink-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Servicios</h3>
              <p className="text-2xl sm:text-3xl font-bold text-pink-600 group-hover:scale-105 transition-transform">
                {stats.servicios}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
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
          <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">8 categorías diferentes</p>
        </div>

        <Link href="/rachell-admin/resenas" className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:border-pink-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Reseñas</h3>
              <p className="text-2xl sm:text-3xl font-bold text-pink-600 group-hover:scale-105 transition-transform">
                {stats.resenas}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 mt-2 flex items-center justify-between">
            <span>4.8 calificación promedio</span>
            {stats.resenasPendientes > 0 && (
              <span className="text-pink-600 font-medium flex items-center">
                {stats.resenasPendientes} pendiente{stats.resenasPendientes !== 1 && 's'}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </span>
            )}
          </div>
        </Link>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:border-pink-200 transition-all hover:shadow-md group">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 truncate">Galería</h3>
              <p className="text-2xl sm:text-3xl font-bold text-pink-600 group-hover:scale-105 transition-transform">
                {stats.fotos}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
              <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 truncate">12 añadidas este mes</p>
        </div>
      </div>

      {/* Gráfico y Citas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Tendencias Mensuales</h3>
          <AreaChart
            className="h-60 sm:h-72 mt-4"
            data={chartdata}
            index="date"
            categories={["citas", "reseñas"]}
            colors={["pink", "rose"]}
            valueFormatter={(number) => number.toString()}
            showAnimation={true}
          />
        </div>

        {/* Citas Recientes */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center text-base sm:text-lg">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-pink-600" />
              Próximas Citas
            </h3>
            <span className="text-xs text-gray-500">Hoy</span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {citasRecientes.map((cita) => (
              <div 
                key={cita.id} 
                className="group flex items-start space-x-3 sm:space-x-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate group-hover:text-pink-600 transition-colors text-sm sm:text-base">
                    {cita.cliente}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{cita.servicio}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(cita.fecha), "d MMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                    cita.estado === 'confirmada' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {cita.estado}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center justify-center gap-1 group">
            Ver todas las citas
            <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
} 