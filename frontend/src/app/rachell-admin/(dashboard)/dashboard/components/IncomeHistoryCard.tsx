'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BanknotesIcon, 
  ArrowTrendingUpIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { getIncomeData, IncomeData } from '@/services/income-service'

export default function IncomeHistoryCard() {
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
          <BanknotesIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos históricos disponibles</p>
        </div>
      </motion.div>
    )
  }

  const {
    historicalIncome,
    totalAppointments,
    averageMonthlyIncome,
    totalGrowthPercentage,
    bestMonth,
    averagePerAppointment
  } = incomeData

  const isGrowthPositive = totalGrowthPercentage >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
          <BanknotesIcon className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ingresos Históricos
          </h3>
          <p className="text-sm text-gray-500">
            Total desde el inicio
          </p>
        </div>
      </div>

      {/* Main Historical Income Display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900">
            ${parseFloat(String(historicalIncome)).toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">USD</span>
        </div>
        
        {/* Growth Indicator */}
        <div className="flex items-center gap-2">
          {isGrowthPositive ? (
            <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 rotate-180" />
          )}
          <span className={`text-sm font-medium ${
            isGrowthPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isGrowthPositive ? '+' : ''}{totalGrowthPercentage.toFixed(1)}% crecimiento total
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4 flex-grow">
        {/* Total Appointments */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Total de citas</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            {parseInt(String(totalAppointments)).toLocaleString()}
          </span>
        </div>

        {/* Average Monthly Income */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Promedio mensual</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            ${parseFloat(String(averageMonthlyIncome)).toFixed(2)}
          </span>
        </div>

        {/* Average Per Appointment */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Promedio por cita</span>
          </div>
          <span className="text-lg font-semibold text-gray-900">
            ${parseFloat(String(averagePerAppointment)).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Best Month Highlight */}
      {bestMonth.income > 0 && (
        <div className="mt-auto p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-indigo-800">
                Mejor mes
              </p>
              <p className="text-xl font-bold text-indigo-900">
                {bestMonth.month}
              </p>
            </div>
            <div className="text-right space-y-2">
              <p className="text-xl font-bold text-indigo-600">
                ${parseFloat(String(bestMonth.income)).toFixed(2)}
              </p>
              <p className="text-sm text-indigo-500 font-medium">
                Ingresos récord
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
