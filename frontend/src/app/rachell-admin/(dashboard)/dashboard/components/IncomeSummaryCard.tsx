'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  TagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { getIncomeData, IncomeData } from '@/services/income-service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function IncomeSummaryCard() {
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const data = await getIncomeData()
        setIncomeData(data)
      } catch (error) {
        console.error('Error al obtener datos de ingresos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIncomeData()
  }, [])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </motion.div>
    )
  }

  if (!incomeData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="text-center text-gray-500">
          <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos de ingresos disponibles</p>
        </div>
      </motion.div>
    )
  }

  const {
    totalIncome,
    previousMonthIncome,
    growthPercentage,
    targetIncome,
    targetPercentage,
    remainingAmount
  } = incomeData

  const isGrowthPositive = growthPercentage >= 0
  const isTargetMet = targetPercentage >= 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
            <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ingresos Totales
            </h3>
            <p className="text-sm text-gray-500">
              {format(new Date(), 'MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Mes actual</span>
        </div>
      </div>

      {/* Main Income Display */}
      <div className="mb-6 flex-grow">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            ${parseFloat(String(totalIncome)).toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">USD</span>
        </div>
        
        {/* Growth Indicator */}
        <div className="flex items-center gap-2">
          {isGrowthPositive ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            isGrowthPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isGrowthPositive ? '+' : ''}{growthPercentage.toFixed(1)}% vs mes anterior
          </span>
        </div>
      </div>

      {/* Target Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Meta mensual</span>
          </div>
          <span className="text-sm text-gray-400 italic">
            No configurada
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
          <div className="h-2 rounded-full bg-gray-300" style={{ width: '0%' }} />
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 italic">
            Meta por definir
          </span>
          <span className="text-gray-400 italic">
            -
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Mes anterior</p>
          <p className="text-sm font-semibold text-gray-900">
            ${parseFloat(String(previousMonthIncome)).toFixed(2)}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
