'use client'

import EditServiceClient from './EditServiceClient'

export default function EditServicePage({
  params,
}: {
  params: { id: string }
}) {
  return <EditServiceClient id={params.id} />
} 