import { Suspense } from 'react'
import { BookingForm } from '@/components/agenda/BookingForm' 

export default function AgendarPage() {
  return (
    <main className="pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* Header decorativo */}
        <div className="text-center mb-8">
          {/* Líneas decorativas */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-pink-300"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full mx-3"></div>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-pink-300"></div>
          </div>
          
          {/* Título principal */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Agenda tu Cita
          </h1>
          
          {/* Subtítulo elegante */}
          <p className="text-pink-600 font-medium text-sm sm:text-base">
            Reserva tu momento de belleza ✨
          </p>
          
          {/* Líneas decorativas */}
          <div className="flex items-center justify-center mt-4">
            <div className="w-6 h-px bg-gradient-to-r from-transparent to-pink-200"></div>
            <div className="w-2 h-2 bg-pink-300 rounded-full mx-2"></div>
            <div className="w-6 h-px bg-gradient-to-l from-transparent to-pink-200"></div>
          </div>
        </div>
        
        <Suspense fallback={<div className="flex justify-center items-center py-8">Cargando...</div>}>
          <BookingForm />
        </Suspense>
      </div>
    </main>
  )
} 