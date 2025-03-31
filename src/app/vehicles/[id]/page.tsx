// src/app/vehicles/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Edit, 
  User,
  Calendar,
  FileText,
  Clock,
  Tool,
  Plus
} from 'lucide-react';
import prisma from '@/lib/db';
import { formatDate, getVehicleDisplayName, getFullName, getStatusColor } from '@/lib/utils';

export default async function VehicleDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Fetch vehicle data with related records
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      workOrders: {
        include: {
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      appointments: {
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getVehicleDisplayName(vehicle.make, vehicle.model, vehicle.year)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Added on {formatDate(vehicle.createdAt)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link
            href={`/vehicles/${vehicle.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <Link
            href={`/work-orders/new?vehicleId=${vehicle.id}&customerId=${vehicle.customerId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vehicle Info */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Make / Model / Year</p>
              <p className="mt-1 text-sm text-gray-900">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Color</p>
              <p className="mt-1 text-sm text-gray-900">
                {vehicle.color || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">VIN</p>
              <p className="mt-1 text-sm text-gray-900">{vehicle.vin}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">License Plate</p>
              <p className="mt-1 text-sm text-gray-900">
                {vehicle.licensePlate || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Mileage</p>
              <p className="mt-1 text-sm text-gray-900">
                {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not recorded'}
              </p>
            </div>
            {vehicle.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {vehicle.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Owner Info */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h2>
          {vehicle.customer ? (
            <div className="space-y-4">
              <Link href={`/customers/${vehicle.customer.id}`} className="flex items-center">
                <div className="h-10 w-10 flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-800 font-medium text-sm">
                      {vehicle.customer.firstName.charAt(0)}
                      {vehicle.customer.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {getFullName(vehicle.customer.firstName, vehicle.customer.lastName)}
                  </div>
                  <div className="text-sm text-gray-500">
                    View customer profile
                  </div>
                </div>
              </Link>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <a href={`tel:${vehicle.customer.phone}`} className="mt-1 text-sm text-indigo-600 hover:text-indigo-900">
                  {vehicle.customer.phone}
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <a href={`mailto:${vehicle.customer.email}`} className="mt-1 text-sm text-indigo-600 hover:text-indigo-900">
                  {vehicle.customer.email}
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <User className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No owner assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                This vehicle is not associated with a customer.
              </p>
            </div>
          )}
        </div>

        {/* Service History */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Service Summary</h2>
          <div className="space-y-6">
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Work Orders</span>
                <span className="ml-auto text-xl font-semibold text-gray-900">
                  {vehicle.workOrders.length}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-md">
              <div className="flex items-center">
                <Tool className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Last Service</span>
                <span className="ml-auto text-sm font-medium text-gray-900">
                  {vehicle.workOrders.length > 0
                    ? formatDate(vehicle.workOrders[0].startDate)
                    : 'No service record'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-md">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500">Upcoming Appointments</span>
                <span className="ml-auto text-xl font-semibold text-gray-900">
                  {vehicle.appointments.filter(a => 
                    new Date(a.date) >= new Date() && 
                    a.status !== 'CANCELED' && 
                    a.status !== 'COMPLETED').length}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Work Orders */}
        <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Work Orders</h2>
            <Link
              href={`/work-orders?vehicleId=${vehicle.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>

          {vehicle.workOrders.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                This vehicle doesn't have any work orders yet.
              </p>
              <div className="mt-6">
                <Link
                  href={`/work-orders/new?vehicleId=${vehicle.id}&customerId=${vehicle.customerId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create Work Order
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Order #
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Description
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Services
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {vehicle.workOrders.map((workOrder) => (
                    <tr key={workOrder.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {workOrder.orderNumber}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(workOrder.startDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(workOrder.status, 'bg')} ${getStatusColor(workOrder.status, 'text')}`}>
                          {workOrder.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {workOrder.description}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {workOrder.lineItems.length} items
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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
          )}
        </div>
        
        {/* Upcoming Appointments */}
        <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
            <Link
              href={`/appointments?vehicleId=${vehicle.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>

          {vehicle.appointments.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                This vehicle doesn't have any upcoming appointments.
              </p>
              <div className="mt-6">
                <Link
                  href={`/appointments/new?vehicleId=${vehicle.id}&customerId=${vehicle.customerId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Schedule Appointment
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Date & Time
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Notes
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {vehicle.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div>{formatDate(appointment.date, 'PPP')}</div>
                        <div className="text-gray-500">
                          {formatDate(appointment.startTime, 'p')} - {formatDate(appointment.endTime, 'p')}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status, 'bg')} ${getStatusColor(appointment.status, 'text')}`}>
                          {appointment.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {appointment.notes || '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/appointments/${appointment.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}