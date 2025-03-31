// src/app/dashboard/page.tsx
import Link from 'next/link';
import { 
  Users, 
  Car, 
  Clipboard, 
  Calendar, 
  Package, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Wrench, 
  DollarSign
} from 'lucide-react';
import prisma from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function DashboardPage() {
  // Fetch summary statistics
  const [
    totalCustomers,
    totalVehicles,
    totalWorkOrders,
    activeWorkOrders,
    totalAppointments,
    upcomingAppointments,
    totalInventoryItems,
    lowStockItems,
    todaysAppointments,
    recentWorkOrders,
    incompleteWorkOrders,
    monthlySales
  ] = await Promise.all([
    // Customer count
    prisma.customer.count(),
    
    // Vehicle count
    prisma.vehicle.count(),
    
    // Work order counts
    prisma.workOrder.count(),
    prisma.workOrder.count({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_PARTS']
        }
      }
    }),
    
    // Appointment counts
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        date: {
          gte: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    }),
    
    // Inventory counts
    prisma.inventoryItem.count(),
    prisma.inventoryItem.count({
      where: {
        quantity: {
          lte: prisma.inventoryItem.fields.minQuantity
        }
      }
    }),
    
    // Today's appointments
    prisma.appointment.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      },
      include: {
        customer: true,
        vehicle: true
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    }),
    
    // Recent work orders
    prisma.workOrder.findMany({
      where: {
        status: {
          not: 'CANCELED'
        }
      },
      include: {
        customer: true,
        vehicle: true,
        lineItems: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    }),
    
    // Incomplete work orders
    prisma.workOrder.findMany({
      where: {
        status: {
          in: ['IN_PROGRESS', 'WAITING_FOR_PARTS']
        }
      },
      include: {
        customer: true,
        vehicle: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    }),
    
    // Monthly sales (last 6 months)
    prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', i.date) as month,
        SUM(i.total) as total
      FROM 
        "Invoice" i
      WHERE 
        i.status != 'VOID'
        AND i.date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY 
        DATE_TRUNC('month', i.date)
      ORDER BY 
        month ASC
    `
  ]);

  // Format monthly sales data for display
  const formattedMonthlySales = monthlySales.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    total: Number(item.total)
  }));

  // Calculate total from recent work orders
  const recentWorkOrdersTotal = recentWorkOrders.reduce((sum, order) => {
    const orderTotal = order.lineItems.reduce((itemSum, item) => {
      return itemSum + (item.quantity * item.unitPrice) + 
        ((item.laborHours && item.laborRate) ? item.laborHours * item.laborRate : 0);
    }, 0);
    return sum + orderTotal;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Welcome to the Garage Management System. Here's an overview of your business.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{totalCustomers}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/customers" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Vehicles Registered</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{totalVehicles}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/vehicles" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clipboard className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Work Orders</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{activeWorkOrders}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/work-orders" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Appointments</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{upcomingAppointments}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/appointments" className="font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Main Content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Today's Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Appointments</h3>
              <Link href="/appointments" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
          </div>
          
          <div className="px-6 py-5">
            {todaysAppointments.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no scheduled appointments for today.
                </p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {todaysAppointments.map((appointment) => (
                    <li key={appointment.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/appointments/${appointment.id}`} className="focus:outline-none">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {appointment.customer.firstName} {appointment.customer.lastName}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {appointment.vehicle.year} {appointment.vehicle.make} {appointment.vehicle.model}
                            </p>
                          </Link>
                        </div>
                        <div>
                          <Link href={`/appointments/${appointment.id}`}>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {formatDate(appointment.startTime, 'p')}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Incomplete Work Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">In-Progress Work Orders</h3>
              <Link 
                href="/work-orders?status=IN_PROGRESS"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
          </div>
          
          <div className="px-6 py-5">
            {incompleteWorkOrders.length === 0 ? (
              <div className="text-center py-6">
                <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active work orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no work orders currently in progress.
                </p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {incompleteWorkOrders.map((workOrder) => (
                    <li key={workOrder.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Wrench className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/work-orders/${workOrder.id}`} className="focus:outline-none">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {workOrder.orderNumber}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {workOrder.vehicle.year} {workOrder.vehicle.make} {workOrder.vehicle.model}
                            </p>
                          </Link>
                        </div>
                        <div>
                          <Link href={`/work-orders/${workOrder.id}`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              workOrder.status === 'WAITING_FOR_PARTS' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {workOrder.status.replace(/_/g, ' ')}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Work Orders */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Work Orders</h3>
              <div className="flex space-x-3">
                <span className="text-sm font-medium text-gray-500">
                  Total: {formatCurrency(recentWorkOrdersTotal)}
                </span>
                <Link href="/work-orders" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-5">
            {recentWorkOrders.length === 0 ? (
              <div className="text-center py-6">
                <Clipboard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by creating your first work order.
                </p>
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
                        Customer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">View</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentWorkOrders.map((workOrder) => {
                      const total = workOrder.lineItems.reduce((sum, item) => {
                        return sum + (item.quantity * item.unitPrice) + 
                          ((item.laborHours && item.laborRate) ? item.laborHours * item.laborRate : 0);
                      }, 0);
                      
                      return (
                        <tr key={workOrder.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {workOrder.orderNumber}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {workOrder.customer.firstName} {workOrder.customer.lastName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              workOrder.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              workOrder.status === 'INVOICED' ? 'bg-orange-100 text-orange-800' :
                              workOrder.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              workOrder.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              workOrder.status === 'WAITING_FOR_PARTS' ? 'bg-purple-100 text-purple-800' :
                              workOrder.status === 'CANCELED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {workOrder.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                            {formatCurrency(total)}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link href={`/work-orders/${workOrder.id}`} className="text-indigo-600 hover:text-indigo-900">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Inventory Alerts</h3>
              <Link href="/inventory" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View inventory
              </Link>
            </div>
          </div>
          
          <div className="px-6 py-5">
            <div className="rounded-md bg-yellow-50 p-4 mb-5">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      {lowStockItems} inventory items are below the minimum stock level.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <Link
                        href="/inventory?filter=low-stock"
                        className="px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        View items
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-md">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Total Items</span>
                  <span className="ml-auto text-lg font-semibold text-gray-900">
                    {totalInventoryItems}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-md">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Monthly Sales</span>
                </div>
                <div className="mt-2 h-16 flex items-end space-x-1">
                  {formattedMonthlySales.map((item, index) => {
                    // Find max value for scaling
                    const maxValue = Math.max(...formattedMonthlySales.map(s => s.total));
                    // Calculate height as percentage of max value (between 20% and 100%)
                    const heightPercent = 20 + ((item.total / maxValue) * 80);
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-indigo-200 rounded-t"
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1 truncate" style={{ maxWidth: '40px' }}>
                          {item.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:px-6 rounded-md">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Quick Actions</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href="/inventory/new"
                    className="inline-flex justify-center items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Add Inventory
                  </Link>
                  <Link
                    href="/inventory/order"
                    className="inline-flex justify-center items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    Order Parts
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}