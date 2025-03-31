// src/app/customers/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Edit, 
  Phone, 
  Mail,
  MapPin,
  Car,
  Plus,
  FileText,
  Calendar,
  AlertCircle,
  Clock 
} from 'lucide-react';
import prisma from '@/lib/db';
import { formatDate, getFullName, getVehicleDisplayName, getStatusColor } from '@/lib/utils';

export default async function CustomerDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Fetch customer data with related records
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      vehicles: true,
      workOrders: {
        include: {
          vehicle: true,
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      appointments: {
        include: {
          vehicle: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      },
      invoices: {
        include: {
          workOrder: true,
          payments: true,
        },
        orderBy: { date: 'desc' },
        take: 5,
      },
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getFullName(customer.firstName, customer.lastName)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Customer since {formatDate(customer.createdAt, 'MMMM yyyy')}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <Link
            href={`/work-orders/new?customerId=${customer.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <Phone className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <a 
                  href={`tel:${customer.phone}`} 
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  {customer.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <a 
                  href={`mailto:${customer.email}`} 
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  {customer.email}
                </a>
              </div>
            </div>
            {customer.address && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">
                    {customer.address}
                    {customer.city && <span><br />{customer.city}{customer.state && `, ${customer.state}`} {customer.zipCode}</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Vehicles</h2>
            <Link
              href={`/vehicles/new?customerId=${customer.id}`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Vehicle
            </Link>
          </div>

          {customer.vehicles.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Car className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new vehicle.
              </p>
              <div className="mt-6">
                <Link
                  href={`/vehicles/new?customerId=${customer.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add Vehicle
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Vehicle
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      VIN
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      License Plate
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customer.vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">
                          {getVehicleDisplayName(vehicle.make, vehicle.model, vehicle.year)}
                        </div>
                        <div className="text-gray-500">{vehicle.color}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {vehicle.vin}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {vehicle.licensePlate || '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View<span className="sr-only">, {vehicle.make} {vehicle.model}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Work Orders */}
        <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Work Orders</h2>
            <Link
              href={`/work-orders?customerId=${customer.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>

          {customer.workOrders.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                This customer doesn't have any work orders yet.
              </p>
              <div className="mt-6">
                <Link
                  href={`/work-orders/new?customerId=${customer.id}`}
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
                      Vehicle
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
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customer.workOrders.map((workOrder) => (
                    <tr key={workOrder.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {workOrder.orderNumber}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {workOrder.vehicle ? getVehicleDisplayName(
                          workOrder.vehicle.make,
                          workOrder.vehicle.model,
                          workOrder.vehicle.year
                        ) : 'Unknown'}
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
              href={`/appointments?customerId=${customer.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>

          {customer.appointments.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                This customer doesn't have any upcoming appointments.
              </p>
              <div className="mt-6">
                <Link
                  href={`/appointments/new?customerId=${customer.id}`}
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
                      Vehicle
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
                  {customer.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div>{formatDate(appointment.date, 'PPP')}</div>
                        <div className="text-gray-500">
                          {formatDate(appointment.startTime, 'p')} - {formatDate(appointment.endTime, 'p')}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {appointment.vehicle ? getVehicleDisplayName(
                          appointment.vehicle.make,
                          appointment.vehicle.model,
                          appointment.vehicle.year
                        ) : 'Unknown'}
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