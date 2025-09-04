'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { getAppointments } from '@/services/appointment-service'
import { getServices } from '@/services/service-service'
import { format, startOfDay, endOfDay, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface TrendData {
  date: string
  citas: number
  ingresos: number
}

interface TrendChartProps {
  className?: string
}

export default function TrendChart({ className }: TrendChartProps) {
  console.log('🔍 TrendChart - Componente iniciado')
  console.log('🔍 TrendChart - Props:', className)
  console.log('🔍 TrendChart - Timestamp:', new Date().toISOString())
  
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCitas, setTotalCitas] = useState(0)
  const [totalIngresos, setTotalIngresos] = useState(0)
  const [trendDirection, setTrendDirection] = useState<'up' | 'down' | 'stable'>('stable')

  useEffect(() => {
    console.log('🔍 TrendChart - useEffect ejecutado')
    
    const loadTrendData = async () => {
      try {
        setLoading(true)
        
        const appointmentsData = await getAppointments({ limit: 1000 })
        console.log('🔍 TrendChart - Citas obtenidas:', appointmentsData.appointments.length)
        console.log('🔍 TrendChart - Citas completadas:', appointmentsData.appointments.filter(apt => apt.status === 'COMPLETED').length)
        
        // Ver las fechas de las citas completadas
        const citasCompletadas = appointmentsData.appointments.filter(apt => apt.status === 'COMPLETED')
        console.log('🔍 TrendChart - Fechas de citas completadas:', citasCompletadas.map(apt => ({
          fecha: apt.date,
          fechaFormateada: format(new Date(apt.date), 'yyyy-MM-dd'),
          nombre: apt.clientName
        })))
        
        const servicesData = await getServices()
        console.log('🔍 TrendChart - Servicios obtenidos:', servicesData.length)
        
        const today = new Date()
        console.log('🔍 TrendChart - Fecha actual:', format(today, 'yyyy-MM-dd'))
        
        // Obtener el lunes de la semana actual
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // 1 = lunes
        console.log('🔍 TrendChart - Inicio de semana (lunes):', format(weekStart, 'yyyy-MM-dd'))
        
        // Generar datos de la semana actual (lunes a domingo)
        const weekDays: TrendData[] = []
        
        for (let i = 0; i < 7; i++) {
          const date = addDays(weekStart, i)
          const startOfDate = startOfDay(date)
          const endOfDate = endOfDay(date)
          
          console.log(`🔍 TrendChart - Buscando citas para: ${format(date, 'yyyy-MM-dd')}`)
          
          const citasDelDia = appointmentsData.appointments.filter(apt => {
            const aptDate = new Date(apt.date)
            return aptDate >= startOfDate && aptDate <= endOfDate && apt.status === 'COMPLETED'
          })
          
          console.log(`🔍 TrendChart - Citas del ${format(date, 'yyyy-MM-dd')}:`, citasDelDia.length)
          
          const ingresosDelDia = citasDelDia.reduce((total, apt) => {
            const service = servicesData.find(s => s.id === apt.serviceId)
            const precio = Number(service?.price || 0)
            console.log(`🔍 TrendChart - Servicio encontrado para ${apt.serviceId}:`, service?.name, 'Precio original:', service?.price, 'Precio convertido:', precio)
            return total + precio
          }, 0)
          
          console.log(`🔍 TrendChart - Ingresos del día ${format(date, 'yyyy-MM-dd')}:`, ingresosDelDia)
          
          weekDays.push({
            date: format(date, 'EEE', { locale: es }),
            citas: citasDelDia.length,
            ingresos: ingresosDelDia
          })
        }
        
        setTrendData(weekDays)
        
        // Calcular totales
        const totalC = weekDays.reduce((sum: number, day: TrendData) => sum + day.citas, 0)
        const totalI = weekDays.reduce((sum: number, day: TrendData) => sum + day.ingresos, 0)
        setTotalCitas(totalC)
        setTotalIngresos(totalI)
        
        console.log('🔍 TrendChart - Totales calculados:', { totalCitas: totalC, totalIngresos: totalI })
        console.log('🔍 TrendChart - Tipo de totalIngresos:', typeof totalI, 'Valor:', totalI)
        console.log('🔍 TrendChart - Datos de la semana:', weekDays)
        
        // Calcular tendencia (comparar últimos 3 días vs anteriores 3 días)
        const ultimos3Dias = weekDays.slice(-3)
        const anteriores3Dias = weekDays.slice(-6, -3)
        
        const promedioUltimos = ultimos3Dias.reduce((sum, day) => sum + day.citas, 0) / 3
        const promedioAnteriores = anteriores3Dias.reduce((sum, day) => sum + day.citas, 0) / 3
        
        if (promedioUltimos > promedioAnteriores * 1.1) {
          setTrendDirection('up')
        } else if (promedioUltimos < promedioAnteriores * 0.9) {
          setTrendDirection('down')
        } else {
          setTrendDirection('stable')
        }
        
      } catch (error) {
        console.error('❌ Error cargando datos de tendencia:', error)
        console.log('🔍 TrendChart - Error completo:', error)
        console.log('🔍 TrendChart - Error stack:', error instanceof Error ? error.stack : 'No stack')
      } finally {
        console.log('🔍 TrendChart - useEffect completado')
        setLoading(false)
      }
    }

    console.log('🔍 TrendChart - Llamando loadTrendData')
    loadTrendData()
  }, [])

  const maxCitas = Math.max(...trendData.map(d => d.citas), 1)
  const maxIngresos = Math.max(...trendData.map(d => d.ingresos), 1)
  
  // Verificar si hay datos
  const hasData = totalCitas > 0 || totalIngresos > 0

  console.log('🔍 TrendChart - Render:', { loading, hasData, totalCitas, totalIngresos })

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <ChartBarIcon className="w-5 h-5 mr-2 text-primary-600" />
            Actividad de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <ChartBarIcon className="w-5 h-5 mr-2 text-primary-600" />
            Actividad de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No hay actividad esta semana</p>
            <p className="text-sm text-gray-400">Las citas completadas e ingresos aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log('🔍 TrendChart - Retornando componente')
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-primary-600" />
            Actividad de la Semana
          </div>
          <div className="flex items-center space-x-2">
            {trendDirection === 'up' && (
              <div className="flex items-center text-green-600">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">↑</span>
              </div>
            )}
            {trendDirection === 'down' && (
              <div className="flex items-center text-red-600">
                <ArrowDownIcon className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">↓</span>
              </div>
            )}
            {trendDirection === 'stable' && (
              <div className="flex items-center text-gray-600">
                <span className="text-sm font-medium">→</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Descripción */}
          <div className="text-sm text-gray-600 mb-4">
            Resumen de citas e ingresos de la semana actual (lunes a domingo)
          </div>
          
          {/* Resumen */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">{totalCitas}</p>
              <p className="text-sm text-gray-600">Citas totales</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">${parseFloat(String(totalIngresos)).toFixed(2)}</p>
              <p className="text-sm text-gray-600">Ingresos totales</p>
            </div>
          </div>
          
          {/* Gráfico de citas */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded"></div>
              Citas por día
            </div>
            <div className="flex items-end justify-between space-x-2 h-24">
              {trendData.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-1 flex flex-col items-center"
                >
                  <div 
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t transition-all duration-300 hover:from-primary-600 hover:to-primary-400"
                    style={{ 
                      height: `${Math.max((day.citas / maxCitas) * 100, 8)}%`,
                      minHeight: '8px'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {day.date}
                  </p>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    {day.citas}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Gráfico de ingresos */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              Ingresos por día
            </div>
            <div className="flex items-end justify-between space-x-2 h-24">
              {trendData.map((day, index) => (
                <motion.div
                  key={`ingresos-${day.date}`}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className="flex-1 flex flex-col items-center"
                >
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t transition-all duration-300 hover:from-green-600 hover:to-green-400"
                    style={{ 
                      height: `${Math.max((day.ingresos / maxIngresos) * 100, 8)}%`,
                      minHeight: '8px'
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {day.date}
                  </p>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    ${parseFloat(String(day.ingresos)).toFixed(2)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
