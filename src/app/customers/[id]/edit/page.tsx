// src/app/customers/[id]/edit/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import CustomerForm from '@/components/customers/CustomerForm';

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
          <p className="mt-2 text-sm text-gray-700">
            Update customer information.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CustomerForm initialData={customer} />
      </div>
    </div>
  );
}