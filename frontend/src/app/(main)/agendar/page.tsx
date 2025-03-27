import { BookingForm } from '@/components/agenda/BookingForm' 

export default function AgendarPage() {
  return (
    <main className="pt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
          Agenda tu Cita
        </h1>
        <BookingForm />
      </div>
    </main>
  )
} 