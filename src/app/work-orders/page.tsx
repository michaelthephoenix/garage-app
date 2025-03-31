// src/app/work-orders/page.tsx
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import WorkOrderList from '@/components/work-orders/WorkOrderList';

export default function WorkOrdersPage({
  searchParams
}: {
  searchParams: { 
    customerId?: string;
    vehicleId?: string;
    technicianId?: string;
  }
}) {
  const { customerId, vehicleId, technicianId } = searchParams;
  
  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Work Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage service and repair work orders, track status, and view details.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/work-orders/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      <WorkOrderList 
        customerId={customerId}
        vehicleId={vehicleId}
        technicianId={technicianId}
      />
    </div>
  );
}