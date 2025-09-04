'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StarIcon } from '@heroicons/react/24/outline'
import { getIncomeData, IncomeData } from '@/services/income-service'

export default function TopServicesChart() {
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

  if (!incomeData || !incomeData.topServices.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="text-center text-gray-500">
          <StarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos de servicios disponibles</p>
        </div>
      </motion.div>
    )
  }

  const chartData = incomeData.topServices.map(service => ({
    ...service,
    income: Math.round(service.income),
    percentage: Math.round(service.percentage)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-purple-600">
            Ingresos: ${parseFloat(String(payload[0]?.value || 0)).toFixed(2)}
          </p>
          <p className="text-gray-600">
            Porcentaje: {payload[0]?.payload?.percentage}%
          </p>
          <p className="text-gray-500">
            Citas: {payload[0]?.payload?.count}
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
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg">
          <StarIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Servicios Más Rentables
          </h3>
          <p className="text-sm text-gray-500">
            Top 5 del mes actual
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="income" 
              fill="#8b5cf6" 
              radius={[0, 4, 4, 0]}
              name="Ingresos"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Services List */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="space-y-2">
          {incomeData.topServices.slice(0, 3).map((service, index) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  index === 0 ? 'bg-purple-500' : 
                  index === 1 ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-700 truncate max-w-[120px]">
                  {service.name}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  ${parseFloat(String(service.income)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {service.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
