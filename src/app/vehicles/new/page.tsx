// src/app/vehicles/new/page.tsx
import { redirect } from 'next/navigation';
import VehicleForm from '@/components/vehicles/VehicleForm';
import prisma from '@/lib/db';

export default async function NewVehiclePage({
  searchParams
}: {
  searchParams: { customerId?: string }
}) {
  const customerId = searchParams.customerId;
  
  // If customer ID is provided, verify it exists
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (!customer) {
      redirect('/vehicles/new'); // Redirect to regular form if customer not found
    }
  }
  
  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">New Vehicle</h1>
          <p className="mt-2 text-sm text-gray-700">
            Register a new vehicle in the system.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <VehicleForm preselectedCustomerId={customerId} />
      </div>
    </div>
  );
}