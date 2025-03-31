// src/app/work-orders/new/page.tsx
import { redirect } from 'next/navigation';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';
import prisma from '@/lib/db';

export default async function NewWorkOrderPage({
  searchParams
}: {
  searchParams: { 
    customerId?: string;
    vehicleId?: string;
  }
}) {
  const { customerId, vehicleId } = searchParams;
  
  // Validate if customer and vehicle exist
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true }
    });
    
    if (!customer) {
      redirect('/work-orders/new');
    }
  }
  
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, customerId: true }
    });
    
    if (!vehicle) {
      redirect('/work-orders/new');
    }
    
    // If we have both customerId and vehicleId, make sure the vehicle belongs to the customer
    if (customerId && vehicle.customerId !== customerId) {
      redirect(`/work-orders/new?customerId=${customerId}`);
    }
  }
  
  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">New Work Order</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new service or repair work order.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <WorkOrderForm 
          preselectedCustomerId={customerId}
          preselectedVehicleId={vehicleId}
        />
      </div>
    </div>
  );
}