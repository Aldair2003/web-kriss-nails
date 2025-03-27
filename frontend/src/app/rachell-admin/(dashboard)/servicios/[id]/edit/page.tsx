import { notFound } from 'next/navigation'
import EditServiceClient from './EditServiceClient'

export default async function EditServicePage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Esperar a que params esté disponible completamente
  const resolvedParams = await params

  // Validar que el ID existe
  if (!resolvedParams.id) {
    notFound()
  }

  return <EditServiceClient id={resolvedParams.id} />
} 