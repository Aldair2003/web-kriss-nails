import { notFound } from 'next/navigation'
import EditServiceClient from './EditServiceClient'
import { use } from 'react'

interface Props {
  params: {
    id: string
  }
}

export default function EditServicePage({ params }: Props) {
  const resolvedParams = use(Promise.resolve(params))
  const id = resolvedParams.id

  if (!id) {
    notFound()
  }

  return <EditServiceClient id={id} />
} 