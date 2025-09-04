'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { getIncomeData, IncomeData } from '@/services/income-service'

export default function WeeklyIncomeChart() {
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
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </motion.div>
    )
  }

  if (!incomeData || !incomeData.weeklyIncome.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="text-center text-gray-500">
          <CalendarDaysIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos de ingresos semanales disponibles</p>
        </div>
      </motion.div>
    )
  }

  const chartData = incomeData.weeklyIncome.map(item => ({
    ...item,
    income: Math.round(item.income)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-orange-600">
            Ingresos: ${parseFloat(String(payload[0]?.value || 0)).toFixed(2)}
          </p>
          <p className="text-gray-500">
            Citas: {payload[0]?.payload?.count}
          </p>
        </div>
      )
    }
    return null
  }

  // Encontrar el día más productivo
  const maxIncome = Math.max(...chartData.map(item => item.income))
  const mostProductiveDay = chartData.find(item => item.income === maxIncome)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg">
          <CalendarDaysIcon className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Días Más Productivos
          </h3>
          <p className="text-sm text-gray-500">
            Ingresos por día de la semana
          </p>
        </div>
      </div>

      {/* Most Productive Day Highlight */}
      {mostProductiveDay && mostProductiveDay.income > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">
                Día más productivo
              </p>
              <p className="text-lg font-bold text-orange-900">
                {mostProductiveDay.day}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-600">
                ${parseFloat(String(mostProductiveDay.income)).toFixed(2)}
              </p>
              <p className="text-xs text-orange-500">
                {mostProductiveDay.count} cita{mostProductiveDay.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="income" 
              fill="#f97316" 
              radius={[4, 4, 0, 0]}
              name="Ingresos"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Summary */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total semanal</p>
            <p className="text-sm font-semibold text-gray-900">
              ${parseFloat(String(chartData.reduce((sum, item) => sum + item.income, 0))).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Promedio diario</p>
            <p className="text-sm font-semibold text-gray-900">
              ${parseFloat(String(Math.round(chartData.reduce((sum, item) => sum + item.income, 0) / 7))).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
