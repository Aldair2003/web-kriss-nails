'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  TrophyIcon, 
  ChevronRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { getTopPerformers, type TopPerformer } from '@/services/dashboard-service'

interface TopPerformersCardProps {
  className?: string
}

export default function TopPerformersCard({ className }: TopPerformersCardProps) {
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTopPerformers = async () => {
      try {
        setLoading(true)
        const data = await getTopPerformers()
        setTopPerformers(data)
      } catch (error) {
        console.error('Error cargando top performers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTopPerformers()
  }, [])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <TrophyIcon className="w-5 h-5 mr-2 text-primary-600" />
            Servicios Más Populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <TrophyIcon className="w-5 h-5 mr-2 text-primary-600" />
          Servicios Más Populares
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topPerformers.length > 0 ? (
          <div className="space-y-3">
            {topPerformers.map((item, index) => (
              <motion.div
                key={item.servicio}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {item.servicio}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center">
                        <ChartBarIcon className="w-3 h-3 mr-1" />
                        {item.citas} cita{item.citas !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center">
                        <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                        ${item.ingresos.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay datos suficientes</p>
            <p className="text-sm text-gray-400 mt-1">Los servicios más populares aparecerán aquí</p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/rachell-admin/servicios'}
          >
            Ver todos los servicios
            <ChevronRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
