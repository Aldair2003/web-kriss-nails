'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { getIncomeData, IncomeData } from '@/services/income-service'

export default function IncomeChart() {
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

  if (!incomeData || !incomeData.monthlyTrend.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="text-center text-gray-500">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos de tendencia disponibles</p>
        </div>
      </motion.div>
    )
  }

  const chartData = incomeData.monthlyTrend.map(item => ({
    ...item,
    income: Math.round(item.income),
    target: Math.round(item.target)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-green-600">
            Ingresos: ${parseFloat(String(payload[0]?.value || 0)).toFixed(2)}
          </p>
          <p className="text-blue-600">
            Meta: ${parseFloat(String(payload[1]?.value || 0)).toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Tendencia de Ingresos
            </h3>
            <p className="text-sm text-gray-500">
              Últimos 6 meses - Análisis detallado
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded opacity-60"></div>
            <span className="text-sm text-gray-600">Meta</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="income" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              name="Ingresos"
            />
            <Bar 
              dataKey="target" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Meta"
              opacity={0.6}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - Solo visible en móvil */}
      <div className="lg:hidden flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-600">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded opacity-60"></div>
          <span className="text-sm text-gray-600">Meta</span>
        </div>
      </div>
    </motion.div>
  )
}
