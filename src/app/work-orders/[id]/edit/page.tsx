// src/app/work-orders/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/db';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';

export default async function EditWorkOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      lineItems: true,
      invoice: {
        select: { id: true },
      },
    },
  });

  if (!workOrder) {
    notFound();
  }

  // Prevent editing if already invoiced or paid
  if (['INVOICED', 'PAID', 'CANCELED'].includes(workOrder.status) || workOrder.invoice) {
    redirect(`/work-orders/${workOrder.id}`);
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Work Order</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update work order information and line items.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <WorkOrderForm initialData={workOrder} />
      </div>
    </div>
  );
}