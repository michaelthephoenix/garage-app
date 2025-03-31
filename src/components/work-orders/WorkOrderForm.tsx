// src/components/work-orders/WorkOrderForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';
import { WorkOrder, WorkOrderFormData, WorkOrderStatus } from '@/types/work-order';
import { Customer } from '@/types/customer';
import { Vehicle } from '../../types/vehicles';
import { InventoryItem } from '@/types/inventory';
import { User } from '@/types/user';
import { formatCurrency, calculateSubtotal } from '@/lib/utils';

interface WorkOrderFormProps {
  initialData?: WorkOrder;
  preselectedCustomerId?: string;
  preselectedVehicleId?: string;
  onSuccess?: (workOrder: WorkOrder) => void;
}

export default function WorkOrderForm({
  initialData,
  preselectedCustomerId,
  preselectedVehicleId,
  onSuccess
}: WorkOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [parts, setParts] = useState<InventoryItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Form data
  const [formData, setFormData] = useState<WorkOrderFormData>({
    description: '',
    diagnosticNotes: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    customerId: preselectedCustomerId || '',
    vehicleId: preselectedVehicleId || '',
    technicianId: '',
    completionDate: undefined,
    lineItems: [],
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description,
        diagnosticNotes: initialData.diagnosticNotes || '',
        startDate: new Date(initialData.startDate).toISOString().split('T')[0],
        completionDate: initialData.completionDate 
          ? new Date(initialData.completionDate).toISOString().split('T')[0] 
          : undefined,
        status: initialData.status,
        customerId: initialData.customerId,
        vehicleId: initialData.vehicleId,
        technicianId: initialData.technicianId || '',
        lineItems: initialData.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          laborHours: item.laborHours || undefined,
          laborRate: item.laborRate || undefined,
          partId: item.partId || undefined,
        })),
      });
    }
  }, [initialData]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, techniciansRes, partsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/users?role=TECHNICIAN'),
          fetch('/api/inventory'),
        ]);

        const [customersData, techniciansData, partsData] = await Promise.all([
          customersRes.json(),
          techniciansRes.json(),
          partsRes.json(),
        ]);

        setCustomers(customersData);
        setTechnicians(techniciansData);
        setParts(partsData);

        // If we have a customerId (either from initial data or preselected), fetch vehicles
        const customerIdToUse = initialData?.customerId || preselectedCustomerId;
        if (customerIdToUse) {
          const vehiclesRes = await fetch(`/api/vehicles?customerId=${customerIdToUse}`);
          const vehiclesData = await vehiclesRes.json();
          setVehicles(vehiclesData);
          setFilteredVehicles(vehiclesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please refresh and try again.');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [initialData?.customerId, preselectedCustomerId]);

  // Filter vehicles when customer changes
  useEffect(() => {
    const fetchVehiclesForCustomer = async () => {
      if (!formData.customerId) {
        setFilteredVehicles([]);
        return;
      }

      try {
        const response = await fetch(`/api/vehicles?customerId=${formData.customerId}`);
        const data = await response.json();
        setVehicles(data);
        setFilteredVehicles(data);

        // If vehicle doesn't belong to this customer, reset it
        if (formData.vehicleId && !data.some(v => v.id === formData.vehicleId)) {
          setFormData(prev => ({
            ...prev,
            vehicleId: '',
          }));
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      }
    };

    if (formData.customerId && !initialData) {
      fetchVehiclesForCustomer();
    }
  }, [formData.customerId, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          laborHours: undefined,
          laborRate: undefined,
          partId: undefined,
        },
      ],
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const handleLineItemChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updatedLineItems = [...prev.lineItems];
      
      if (name === 'partId') {
        // If part is selected, set default values from inventory
        if (value) {
          const selectedPart = parts.find(p => p.id === value);
          if (selectedPart) {
            updatedLineItems[index] = {
              ...updatedLineItems[index],
              partId: value,
              description: selectedPart.name,
              unitPrice: selectedPart.sellingPrice,
            };
          }
        } else {
          updatedLineItems[index] = {
            ...updatedLineItems[index],
            partId: undefined,
          };
        }
      } else if (name === 'quantity' || name === 'unitPrice' || name === 'laborHours' || name === 'laborRate') {
        // Convert numeric fields
        const numValue = parseFloat(value);
        updatedLineItems[index] = {
          ...updatedLineItems[index],
          [name]: isNaN(numValue) ? 0 : numValue,
        };
      } else {
        updatedLineItems[index] = {
          ...updatedLineItems[index],
          [name]: value,
        };
      }
      
      return { ...prev, lineItems: updatedLineItems };
    });
  };

  const getTotalAmount = () => {
    return calculateSubtotal(formData.lineItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate line items
      for (const [index, item] of formData.lineItems.entries()) {
        if (!item.description.trim()) {
          throw new Error(`Line item #${index + 1} requires a description`);
        }
        if (item.quantity <= 0) {
          throw new Error(`Line item #${index + 1} requires a valid quantity`);
        }
        if (item.unitPrice < 0) {
          throw new Error(`Line item #${index + 1} requires a valid price`);
        }
      }

      const url = initialData 
        ? `/api/work-orders/${initialData.id}` 
        : '/api/work-orders';
      
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
        router.push(`/work-orders/${data.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status options
  const statusOptions: WorkOrderStatus[] = [
    'PENDING',
    'IN_PROGRESS',
    'WAITING_FOR_PARTS',
    'COMPLETED',
    ...(initialData?.status === 'INVOICED' || initialData?.status === 'PAID' || initialData?.status === 'CANCELED' 
      ? [initialData.status] : []),
  ];

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 divide-y divide-gray-200">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Work Order Information</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a new work order for vehicle service and repair.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Customer Selection */}
            <div className="sm:col-span-3">
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
                  disabled={!!initialData || !!preselectedCustomerId}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="sm:col-span-3">
              <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">
                Vehicle
              </label>
              <div className="mt-1">
                <select
                  id="vehicleId"
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  required
                  disabled={!!initialData || !!preselectedVehicleId || !formData.customerId}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Select a vehicle</option>
                  {filteredVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vin})
                    </option>
                  ))}
                </select>
                {formData.customerId && filteredVehicles.length === 0 && (
                  <p className="mt-1 text-sm text-red-500">
                    No vehicles found for this customer.
                  </p>
                )}
              </div>
            </div>

            {/* Work Order Description */}
            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the requested work (e.g., Oil change, brake replacement, etc.)"
                />
              </div>
            </div>

            {/* Work Order Status */}
            <div className="sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Technician Assignment */}
            <div className="sm:col-span-2">
              <label htmlFor="technicianId" className="block text-sm font-medium text-gray-700">
                Assigned Technician
              </label>
              <div className="mt-1">
                <select
                  id="technicianId"
                  name="technicianId"
                  value={formData.technicianId}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="">Not assigned</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Date */}
            <div className="sm:col-span-2">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Completion Date (visible based on status) */}
            {(formData.status === 'COMPLETED' || formData.status === 'INVOICED' || formData.status === 'PAID') && (
              <div className="sm:col-span-2">
                <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700">
                  Completion Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="completionDate"
                    name="completionDate"
                    value={formData.completionDate || ''}
                    onChange={handleChange}
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            )}

            {/* Diagnostic Notes */}
            <div className="sm:col-span-6">
              <label htmlFor="diagnosticNotes" className="block text-sm font-medium text-gray-700">
                Diagnostic Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="diagnosticNotes"
                  name="diagnosticNotes"
                  rows={3}
                  value={formData.diagnosticNotes}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add detailed diagnostic findings or technician notes"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Line Items</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add parts, labor, and services to the work order.
            </p>
          </div>

          {formData.lineItems.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items added</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding parts or services to this work order.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.lineItems.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">Item #{index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Remove item</span>
                    </button>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor={`lineItems[${index}].description`} className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, e)}
                          required
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor={`lineItems[${index}].partId`} className="block text-sm font-medium text-gray-700">
                        Select from Inventory
                      </label>
                      <div className="mt-1">
                        <select
                          name="partId"
                          value={item.partId || ''}
                          onChange={(e) => handleLineItemChange(index, e)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="">Custom item</option>
                          {parts.map(part => (
                            <option 
                              key={part.id} 
                              value={part.id}
                              disabled={part.quantity < 1}
                            >
                              {part.name} ({part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-1">
                      <label htmlFor={`lineItems[${index}].quantity`} className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, e)}
                          min="1"
                          step="1"
                          required
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor={`lineItems[${index}].unitPrice`} className="block text-sm font-medium text-gray-700">
                        Unit Price
                      </label>
                      <div className="mt-1">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="unitPrice"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, e)}
                            min="0"
                            step="0.01"
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor={`lineItems[${index}].laborHours`} className="block text-sm font-medium text-gray-700">
                        Labor Hours
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="laborHours"
                          value={item.laborHours || ''}
                          onChange={(e) => handleLineItemChange(index, e)}
                          min="0"
                          step="0.25"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor={`lineItems[${index}].laborRate`} className="block text-sm font-medium text-gray-700">
                        Labor Rate ($/hour)
                      </label>
                      <div className="mt-1">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            name="laborRate"
                            value={item.laborRate || ''}
                            onChange={(e) => handleLineItemChange(index, e)}
                            min="0"
                            step="0.01"
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-6 border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-500">Item Total:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(
                            (item.quantity * item.unitPrice) + 
                            ((item.laborHours && item.laborRate) 
                              ? (item.laborHours * item.laborRate) 
                              : 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddLineItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line Item
            </button>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(getTotalAmount())}
              </p>
            </div>
          </div>
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
          {isSubmitting ? 'Saving...' : initialData ? 'Update Work Order' : 'Create Work Order'}
        </button>
      </div>
    </form>
  );
}