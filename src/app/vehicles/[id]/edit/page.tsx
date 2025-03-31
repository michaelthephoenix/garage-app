// src/app/vehicles/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import VehicleForm from '@/components/vehicles/VehicleForm';

export default async function EditVehiclePage({
  params,
}: {
  params: { id: string };
}) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Vehicle</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update vehicle information.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <VehicleForm initialData={vehicle} />
      </div>
    </div>
  );
}