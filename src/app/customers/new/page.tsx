// src/app/customers/new/page.tsx
import CustomerForm from '@/components/customers/CustomerForm';

export default function NewCustomerPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">New Customer</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new customer record with contact information.
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <CustomerForm />
      </div>
    </div>
  );
}