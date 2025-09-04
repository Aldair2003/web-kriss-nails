import { getAppointments } from './appointment-service'
import { getServices } from './service-service'
import { format, subMonths, startOfMonth, endOfMonth, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

export interface IncomeData {
  totalIncome: number
  previousMonthIncome: number
  growthPercentage: number
  targetIncome: number
  targetPercentage: number
  remainingAmount: number
  topServices: TopService[]
  weeklyIncome: WeeklyIncome[]
  monthlyTrend: MonthlyTrend[]
  // Datos históricos
  historicalIncome: number
  totalAppointments: number
  averageMonthlyIncome: number
  totalGrowthPercentage: number
  bestMonth: {
    month: string
    income: number
  }
  averagePerAppointment: number
}

export interface TopService {
  name: string
  income: number
  percentage: number
  count: number
}

export interface WeeklyIncome {
  day: string
  income: number
  count: number
}

export interface MonthlyTrend {
  month: string
  income: number
  target: number
}

export async function getIncomeData(): Promise<IncomeData> {
  try {
    // Obtener citas de los últimos 6 meses
    const appointmentsData = await getAppointments({ limit: 1000 })
    const servicesData = await getServices()
    
    const currentDate = new Date()
    const currentMonth = startOfMonth(currentDate)
    const previousMonth = startOfMonth(subMonths(currentDate, 1))
    
    // Filtrar citas completadas del mes actual
    const currentMonthAppointments = appointmentsData.appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return apt.status === 'COMPLETED' && 
             aptDate >= currentMonth && 
             aptDate <= endOfMonth(currentDate)
    })
    
    // Filtrar citas completadas del mes anterior
    const previousMonthAppointments = appointmentsData.appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return apt.status === 'COMPLETED' && 
             aptDate >= previousMonth && 
             aptDate < currentMonth
    })
    
    // Calcular ingresos totales
    const totalIncome = currentMonthAppointments.reduce((sum, apt) => {
      const price = Number(apt.service?.price) || 0
      return sum + price
    }, 0)
    
    const previousMonthIncome = previousMonthAppointments.reduce((sum, apt) => {
      const price = Number(apt.service?.price) || 0
      return sum + price
    }, 0)
    
    // Calcular crecimiento
    const growthPercentage = previousMonthIncome > 0 
      ? ((totalIncome - previousMonthIncome) / previousMonthIncome) * 100 
      : 0
    
    // Calcular meta (promedio de últimos 3 meses + 10%)
    const last3MonthsIncome = calculateLast3MonthsIncome(appointmentsData.appointments, servicesData)
    const targetIncome = last3MonthsIncome > 0 ? Math.round(last3MonthsIncome * 1.1) : totalIncome
    const targetPercentage = targetIncome > 0 ? (totalIncome / targetIncome) * 100 : 100
    const remainingAmount = Math.max(0, targetIncome - totalIncome)
    
    // Calcular servicios más rentables
    const topServices = calculateTopServices(currentMonthAppointments, servicesData, totalIncome)
    
    // Calcular ingresos por día de la semana
    const weeklyIncome = calculateWeeklyIncome(currentMonthAppointments, servicesData)
    
    // Calcular tendencia mensual (últimos 6 meses)
    const monthlyTrend = calculateMonthlyTrend(appointmentsData.appointments, servicesData)
    
    // Calcular datos históricos
    const historicalData = calculateHistoricalData(appointmentsData.appointments, servicesData)
    
    return {
      totalIncome,
      previousMonthIncome,
      growthPercentage,
      targetIncome,
      targetPercentage,
      remainingAmount,
      topServices,
      weeklyIncome,
      monthlyTrend,
      ...historicalData
    }
  } catch (error) {
    console.error('Error al obtener datos de ingresos:', error)
    return {
      totalIncome: 0,
      previousMonthIncome: 0,
      growthPercentage: 0,
      targetIncome: 0,
      targetPercentage: 0,
      remainingAmount: 0,
      topServices: [],
      weeklyIncome: [],
      monthlyTrend: [],
      historicalIncome: 0,
      totalAppointments: 0,
      averageMonthlyIncome: 0,
      totalGrowthPercentage: 0,
      bestMonth: {
        month: '',
        income: 0
      },
      averagePerAppointment: 0
    }
  }
}

function calculateLast3MonthsIncome(appointments: any[], services: any[]): number {
  const currentDate = new Date()
  let totalIncome = 0
  let monthsWithData = 0
  
  for (let i = 1; i <= 3; i++) {
    const monthStart = startOfMonth(subMonths(currentDate, i))
    const monthEnd = endOfMonth(subMonths(currentDate, i))
    
    const monthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return apt.status === 'COMPLETED' && 
             aptDate >= monthStart && 
             aptDate <= monthEnd
    })
    
    const monthIncome = monthAppointments.reduce((sum, apt) => {
      const price = Number(apt.service?.price) || 0
      return sum + price
    }, 0)
    
    totalIncome += monthIncome
    if (monthIncome > 0) {
      monthsWithData++
    }
  }
  
  // Si no hay datos de los últimos 3 meses, retornar 0
  return monthsWithData > 0 ? totalIncome / monthsWithData : 0
}

function calculateTopServices(appointments: any[], services: any[], totalIncome: number): TopService[] {
  const serviceStats = new Map<string, { income: number; count: number }>()
  
  appointments.forEach(apt => {
    const serviceName = apt.service?.name
    const price = Number(apt.service?.price) || 0
    if (serviceName) {
      const current = serviceStats.get(serviceName) || { income: 0, count: 0 }
      serviceStats.set(serviceName, {
        income: current.income + price,
        count: current.count + 1
      })
    }
  })
  
  return Array.from(serviceStats.entries())
    .map(([name, stats]) => ({
      name,
      income: stats.income,
      percentage: totalIncome > 0 ? (stats.income / totalIncome) * 100 : 0,
      count: stats.count
    }))
    .sort((a, b) => b.income - a.income)
    .slice(0, 5)
}

function calculateWeeklyIncome(appointments: any[], services: any[]): WeeklyIncome[] {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const weeklyStats = new Map<number, { income: number; count: number }>()
  
  appointments.forEach(apt => {
    const aptDate = new Date(apt.date)
    const dayOfWeek = getDay(aptDate)
    const price = Number(apt.service?.price) || 0
    
    const current = weeklyStats.get(dayOfWeek) || { income: 0, count: 0 }
    weeklyStats.set(dayOfWeek, {
      income: current.income + price,
      count: current.count + 1
    })
  })
  
  return dayNames.map((dayName, index) => ({
    day: dayName,
    income: weeklyStats.get(index)?.income || 0,
    count: weeklyStats.get(index)?.count || 0
  }))
}

function calculateMonthlyTrend(appointments: any[], services: any[]): MonthlyTrend[] {
  const currentDate = new Date()
  const trend = []
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(currentDate, i)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    
    const monthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      return apt.status === 'COMPLETED' && 
             aptDate >= monthStart && 
             aptDate <= monthEnd
    })
    
    const monthIncome = monthAppointments.reduce((sum, apt) => {
      const price = Number(apt.service?.price) || 0
      return sum + price
    }, 0)
    
    const target = i === 0 ? monthIncome * 1.1 : monthIncome // Meta para mes actual
    
    trend.push({
      month: format(monthDate, 'MMM', { locale: es }),
      income: monthIncome,
      target: Math.round(target)
    })
  }
  
  return trend
}

function calculateHistoricalData(appointments: any[], services: any[]) {
  // Filtrar solo citas completadas
  const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED')
  
  // Calcular ingresos históricos totales
  const historicalIncome = completedAppointments.reduce((sum, apt) => {
    const price = Number(apt.service?.price) || 0
    return sum + price
  }, 0)
  
  // Total de citas completadas
  const totalAppointments = completedAppointments.length
  
  // Calcular promedio por cita
  const averagePerAppointment = totalAppointments > 0 ? historicalIncome / totalAppointments : 0
  
  // Calcular datos por mes para encontrar el mejor mes y promedio mensual
  const monthlyData = new Map<string, { income: number; count: number }>()
  
  completedAppointments.forEach(apt => {
    const aptDate = new Date(apt.date)
    const monthKey = format(aptDate, 'yyyy-MM')
    const price = Number(apt.service?.price) || 0
    
    const current = monthlyData.get(monthKey) || { income: 0, count: 0 }
    monthlyData.set(monthKey, {
      income: current.income + price,
      count: current.count + 1
    })
  })
  
  // Encontrar el mejor mes
  let bestMonth = { month: '', income: 0 }
  let totalMonthlyIncome = 0
  let monthCount = 0
  
  monthlyData.forEach((data, monthKey) => {
    totalMonthlyIncome += data.income
    monthCount++
    
    if (data.income > bestMonth.income) {
      // Usar una lógica más simple y directa para el formato de fecha
      const [year, month] = monthKey.split('-')
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      const monthName = `${monthNames[parseInt(month) - 1]} ${year}`
      bestMonth = {
        month: monthName,
        income: data.income
      }
    }
  })
  
  // Calcular promedio mensual
  const averageMonthlyIncome = monthCount > 0 ? totalMonthlyIncome / monthCount : historicalIncome
  
  // Si no hay datos históricos, usar el mes actual como mejor mes
  if (bestMonth.income === 0 && historicalIncome > 0) {
    const currentDate = new Date()
    bestMonth = {
      month: format(currentDate, 'MMMM yyyy', { locale: es }),
      income: historicalIncome
    }
  }
  
  // Calcular crecimiento total (comparar primer mes vs último mes)
  const sortedMonths = Array.from(monthlyData.keys()).sort()
  let totalGrowthPercentage = 0
  
  if (sortedMonths.length >= 2) {
    const firstMonthIncome = monthlyData.get(sortedMonths[0])?.income || 0
    const lastMonthIncome = monthlyData.get(sortedMonths[sortedMonths.length - 1])?.income || 0
    
    if (firstMonthIncome > 0) {
      totalGrowthPercentage = ((lastMonthIncome - firstMonthIncome) / firstMonthIncome) * 100
    }
  } else if (sortedMonths.length === 1) {
    // Si solo hay un mes, el crecimiento es 0%
    totalGrowthPercentage = 0
  }
  
  return {
    historicalIncome,
    totalAppointments,
    averageMonthlyIncome,
    totalGrowthPercentage,
    bestMonth,
    averagePerAppointment
  }
}
