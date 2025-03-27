import { notFound } from 'next/navigation'
import EditServiceClient from './EditServiceClient'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditServicePage({ params }: PageProps) {
  // Validar que el ID existe
  if (!params.id) {
    notFound()
  }

  return <EditServiceClient id={params.id} />
} 