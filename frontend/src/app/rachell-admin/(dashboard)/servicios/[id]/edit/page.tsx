import { notFound } from 'next/navigation'
import EditServiceClient from './EditServiceClient'

type Props = {
  params: {
    id: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function EditServicePage({ params }: Props) {
  // Validar que el ID existe
  if (!params.id) {
    notFound()
  }

  return <EditServiceClient id={params.id} />
} 