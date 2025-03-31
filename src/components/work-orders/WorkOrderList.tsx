// src/components/work-orders/WorkOrderList.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  PlusCircle, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  User, 
  Car 
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus } from '@/types/work-order';
import { getStatusColor, formatDate, formatCurrency, calculateSubtotal } from '@/lib/utils';

interface WorkOrderListProps {
  customerId?: string;
  vehicleId?: string;
  technicianId?: string;
}

export default function WorkOrderList({ 
  customerId,
  vehicleId,
  technicianId
}: WorkOrderListProps) {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch work orders
  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        let url = '/api/work-orders';
        const params = new URLSearchParams();
        
        if (customerId) params.append('customerId', customerId);
        if (vehicleId) params.append('vehicleId', vehicleId);
        if (technicianId) params.append('technicianId', technicianId);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch work orders');
        }
        const data = await response.json();
        setWorkOrders(data);
        applyFilters(data, searchQuery, statusFilter);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrders();
  }, [customerId, vehicleId, technicianId]);

  // Apply filters
  const applyFilters = (
    orders: WorkOrder[],
    query: string,
    status: WorkOrderStatus | 'ALL'
  ) => {
    let filtered = orders;
    
    // Apply status filter
    if (status !== 'ALL') {
      filtered = filtered.filter(order => order.status === status);
    }
    
    // Apply search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(lowerQuery) ||
        order.description.toLowerCase().includes(lowerQuery) ||
        (order.customer?.firstName.toLowerCase().includes(lowerQuery) || false) ||
        (order.customer?.lastName.toLowerCase().includes(lowerQuery) || false) ||
        (order.vehicle?.make.toLowerCase().includes(lowerQuery) || false) ||
        (order.vehicle?.model.toLowerCase().includes(lowerQuery) || false)
      );
    }
    
    setFilteredWorkOrders(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(workOrders, query, statusFilter);
  };

  const handleStatusChange = (status: WorkOrderStatus | 'ALL') => {
    setStatusFilter(status);
    applyFilters(workOrders, searchQuery, status);
  };

  const getWorkOrderStatusIcon = (status: WorkOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'WAITING_FOR_PARTS':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      case 'COMPLETED':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'INVOICED':
        return <Check className="h-5 w-5 text-orange-500" />;
      case 'PAID':
        return <Check className="h-5 w-5 text-emerald-500" />;
      case 'CANCELED':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
        <div className="flex">
          <div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Status options for filter
  const statusOptions: { value: WorkOrderStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_FOR_PARTS', label: 'Waiting for Parts' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'INVOICED', label: 'Invoiced' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELED', label: 'Canceled' },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="relative flex-1 max-w-md mb-4 sm:mb-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search work orders..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          
          <Link
            href={customerId && vehicleId
              ? `/work-orders/new?customerId=${customerId}&vehicleId=${vehicleId}`
              : customerId
                ? `/work-orders/new?customerId=${customerId}`
                : vehicleId
                  ? `/work-orders/new?vehicleId=${vehicleId}`
                  : "/work-orders/new"}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      {/* Status filters */}
      {showFilters && (
        <div className="mb-5 bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`px-3 py-2 text-sm rounded-md ${
                  statusFilter === option.value
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredWorkOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'ALL' ? 'Try changing your filters.' : 'Get started by creating a new work order.'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <div className="mt-6">
              <Link
                href="/work-orders/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Work Order
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Work Order
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer & Vehicle
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkOrders.map((workOrder) => (
                  <tr key={workOrder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/work-orders/${workOrder.id}`} className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            {getWorkOrderStatusIcon(workOrder.status)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {workOrder.orderNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            {workOrder._count?.lineItems || 0} items
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        {workOrder.customer && (
                          <Link href={`/customers/${workOrder.customer.id}`} className="group">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-900 group-hover:text-indigo-600">
                                {workOrder.customer.firstName} {workOrder.customer.lastName}
                              </span>
                            </div>
                          </Link>
                        )}
                        {workOrder.vehicle && (
                          <Link href={`/vehicles/${workOrder.vehicle.id}`} className="group mt-1">
                            <div className="flex items-center">
                              <Car className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-500 group-hover:text-indigo-600">
                                {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                              </span>
                            </div>
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(workOrder.startDate)}</div>
                      {workOrder.completionDate && (
                        <div className="text-xs">
                          Completed: {formatDate(workOrder.completionDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(workOrder.status, 'bg')} ${getStatusColor(workOrder.status, 'text')}`}>
                        {workOrder.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {workOrder.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {workOrder.lineItems?.length ? formatCurrency(calculateSubtotal(workOrder.lineItems)) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/work-orders/${workOrder.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View<span className="sr-only">, {workOrder.orderNumber}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}