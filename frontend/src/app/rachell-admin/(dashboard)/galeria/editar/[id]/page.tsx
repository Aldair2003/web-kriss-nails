import { Suspense } from 'react';
import EditarImagenClient from './EditarImagenClient';

export default async function EditarImagenPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <EditarImagenClient imageId={params.id} />
    </div>
  );
} 