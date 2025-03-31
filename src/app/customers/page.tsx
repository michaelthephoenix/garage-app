// src/app/customers/page.tsx
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import CustomerList from '@/components/customers/CustomerList';

export default function CustomersPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your customer database, view customer details, and track their vehicles and service history.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/customers/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Customer
          </Link>
        </div>
      </div>

      <CustomerList />
    </div>
  );
}





