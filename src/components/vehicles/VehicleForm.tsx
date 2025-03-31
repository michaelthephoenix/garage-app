// src/components/vehicles/VehicleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Vehicle, VehicleFormData } from '../../types/vehicles';
import { Customer } from '@/types/customer';

interface VehicleFormProps {
  initialData?: Vehicle;
  customers?: Customer[];
  preselectedCustomerId?: string;
  onSuccess?: (vehicle: Vehicle) => void;
}

export default function VehicleForm({ 
  initialData, 
  customers = [], 
  preselectedCustomerId,
  onSuccess 
}: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(customers.length === 0);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>(customers);
  
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    licensePlate: '',
    color: '',
    mileage: 0,
    customerId: preselectedCustomerId || '',
    notes: '',
  });

  // Load initial data if editing an existing vehicle
  useEffect(() => {
    if (initialData) {
      setFormData({
        make: initialData.make,
        model: initialData.model,
        year: initialData.year,
        vin: initialData.vin,
        licensePlate: initialData.licensePlate || '',
        color: initialData.color || '',
        mileage: initialData.mileage || 0,
        customerId: initialData.customerId,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  // Fetch customers if not provided
  useEffect(() => {
    if (customers.length === 0 && !preselectedCustomerId) {
      const fetchCustomers = async () => {
        try {
          const response = await fetch('/api/customers');
          if (!response.ok) {
            throw new Error('Failed to fetch customers');
          }
          const data = await response.json();
          setAvailableCustomers(data);
        } catch (err) {
          console.error('Error fetching customers:', err);
        } finally {
          setLoadingCustomers(false);
        }
      };

      fetchCustomers();
    } else {
      setLoadingCustomers(false);
    }
  }, [customers, preselectedCustomerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Convert numeric fields
    if (name === 'year' || name === 'mileage') {
      const numValue = parseInt(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = initialData 
        ? `/api/vehicles/${initialData.id}` 
        : '/api/vehicles';
      
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Handle success
      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push(`/vehicles/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate year options (from 1990 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1990 + 2 }, (_, i) => currentYear + 1 - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        {!preselectedCustomerId && (
          <div className="sm:col-span-6">
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
              Customer
            </label>
            <div className="mt-1">
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                disabled={loadingCustomers || !!initialData} // Disable if editing or loading
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Select a customer</option>
                {availableCustomers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName} ({customer.email})
                  </option>
                ))}
              </select>
              {loadingCustomers && (
                <p className="mt-1 text-sm text-gray-500">Loading customers...</p>
              )}
            </div>
          </div>
        )}

        <div className="sm:col-span-3">
          <label htmlFor="make" className="block text-sm font-medium text-gray-700">
            Make
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="make"
              id="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="model" className="block text-sm font-medium text-gray-700">
            Model
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="model"
              id="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <div className="mt-1">
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="color" className="block text-sm font-medium text-gray-700">
            Color
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="color"
              id="color"
              value={formData.color}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">
            Mileage
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="mileage"
              id="mileage"
              value={formData.mileage || ''}
              onChange={handleChange}
              min="0"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
            VIN
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="vin"
              id="vin"
              value={formData.vin}
              onChange={handleChange}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">
            License Plate
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="licensePlate"
              id="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Add any special notes or information about this vehicle.
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Vehicle' : 'Create Vehicle'}
        </button>
      </div>
    </form>
  );
}