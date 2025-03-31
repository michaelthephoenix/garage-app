// src/app/work-orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  Edit, 
  FileText, 
  User, 
  Car, 
  Calendar, 
  DollarSign,
  Tool,
  FileInvoice,
  Clock,
  CheckSquare
} from 'lucide-react';
import prisma from '@/lib/db';
import { 
  formatDate, 
  formatCurrency, 
  calculateSubtotal, 
  calculateTax, 
  calculateTotal, 
  getStatusColor,
  getFullName,
  getVehicleDisplayName,
  formatHoursToHoursAndMinutes
} from '@/lib/utils';

export default async function WorkOrderDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Fetch work order data with related records
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      vehicle: true,
      technician: true,
      lineItems: {
        include: {
          part: true,
        },
      },
      invoice: {
        include: {
          payments: true,
        },
      },
    },
  });

  if (!workOrder) {
    notFound();
  }

  // Calculate totals
  const subtotal = calculateSubtotal(workOrder.lineItems);
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal, tax);

  // Check if we can generate an invoice (not already invoiced and not canceled)
  const canGenerateInvoice = 
    workOrder.status === 'COMPLETED' && 
    !workOrder.invoice;
  
  // Check if we can mark as complete (in progress and not canceled)
  const canMarkComplete = 
    (workOrder.status === 'IN_PROGRESS' || workOrder.status === 'WAITING_FOR_PARTS') && 
    !workOrder.invoice;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold text-gray-900 mr-3">
              Work Order: {workOrder.orderNumber}
            </h1>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(workOrder.status, 'bg')} ${getStatusColor(workOrder.status, 'text')}`}>
              {workOrder.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Created on {formatDate(workOrder.createdAt)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          {!['INVOICED', 'PAID', 'CANCELED'].includes(workOrder.status) && (
            <Link
              href={`/work-orders/${workOrder.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          )}
          
          {canMarkComplete && (
            <form action={`/api/work-orders/${workOrder.id}/complete`} method="POST">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Mark Complete
              </button>
            </form>
          )}
          
          {canGenerateInvoice && (
            <Link
              href={`/invoices/new?workOrderId=${workOrder.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FileInvoice className="h-4 w-4 mr-2" />
              Generate Invoice
            </Link>
          )}
          
          {workOrder.invoice && (
            <Link
              href={`/invoices/${workOrder.invoice.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Invoice
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer & Vehicle Info */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer & Vehicle</h2>
          <div className="space-y-6">
            {workOrder.customer && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-1" />
                  Customer Information
                </h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <Link href={`/customers/${workOrder.customer.id}`} className="group">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                      {getFullName(workOrder.customer.firstName, workOrder.customer.lastName)}
                    </p>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{workOrder.customer.phone}</p>
                  <p className="text-sm text-gray-500">{workOrder.customer.email}</p>
                </div>
              </div>
            )}
            
            {workOrder.vehicle && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Car className="h-4 w-4 text-gray-400 mr-1" />
                  Vehicle Information
                </h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <Link href={`/vehicles/${workOrder.vehicle.id}`} className="group">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                      {getVehicleDisplayName(
                        workOrder.vehicle.make,
                        workOrder.vehicle.model,
                        workOrder.vehicle.year
                      )}
                    </p>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">VIN: {workOrder.vehicle.vin}</p>
                  {workOrder.vehicle.licensePlate && (
                    <p className="text-sm text-gray-500">License: {workOrder.vehicle.licensePlate}</p>
                  )}
                  {workOrder.vehicle.mileage && (
                    <p className="text-sm text-gray-500">Mileage: {workOrder.vehicle.mileage.toLocaleString()} miles</p>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                Service Dates
              </h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-500">Start Date:</p>
                  <p className="text-sm text-gray-900">{formatDate(workOrder.startDate)}</p>
                </div>
                {workOrder.completionDate && (
                  <div className="flex justify-between mt-1">
                    <p className="text-sm text-gray-500">Completion Date:</p>
                    <p className="text-sm text-gray-900">{formatDate(workOrder.completionDate)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {workOrder.technician && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Tool className="h-4 w-4 text-gray-400 mr-1" />
                  Assigned Technician
                </h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-900">
                    {workOrder.technician.name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Order Details */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Work Order Details</h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
              {workOrder.description}
            </p>
          </div>
          
          {workOrder.diagnosticNotes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Diagnostic Notes</h3>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                {workOrder.diagnosticNotes}
              </p>
            </div>
          )}
          
          {/* Line Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Line Items</h3>
            
            {workOrder.lineItems.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">No items added to this work order.</p>
              </div>
            ) : (
              <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Description
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Qty
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Unit Price
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Labor
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {workOrder.lineItems.map((item) => {
                      const partsCost = item.quantity * item.unitPrice;
                      const laborCost = item.laborHours && item.laborRate 
                        ? item.laborHours * item.laborRate
                        : 0;
                      const itemTotal = partsCost + laborCost;
                      
                      return (
                        <tr key={item.id}>
                          <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-900">{item.description}</div>
                            {item.part && (
                              <div className="text-gray-500 text-xs">
                                Part # {item.part.partNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 text-right">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 text-right">
                            {item.laborHours && item.laborRate ? (
                              <div>
                                <div>{formatHoursToHoursAndMinutes(item.laborHours)}</div>
                                <div className="text-xs">@ {formatCurrency(item.laborRate)}/hr</div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-3 py-4 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Totals */}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-right sm:pl-6">
                        Subtotal
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="py-4 pl-4 pr-3 text-sm font-medium text-gray-500 text-right sm:pl-6">
                        Tax (8.75%)
                      </td>
                      <td className="px-3 py-4 text-sm font-medium text-gray-500 text-right">
                        {formatCurrency(tax)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-right sm:pl-6">
                        Total
                      </td>
                      <td className="px-3 py-4 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Invoice Information (if applicable) */}
        {workOrder.invoice && (
          <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Invoice Information</h2>
              <Link
                href={`/invoices/${workOrder.invoice.id}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View Invoice
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">Invoice Details</h3>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Invoice #:</span>
                    <span className="text-sm font-medium text-gray-900">{workOrder.invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(workOrder.invoice.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Due Date:</span>
                    <span className="text-sm text-gray-900">{formatDate(workOrder.invoice.dueDate)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">Payment Status</h3>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusColor(workOrder.invoice.status, 'bg')} ${getStatusColor(workOrder.invoice.status, 'text')}`}>
                      {workOrder.invoice.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(workOrder.invoice.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Paid:</span>
                    <span className="text-sm text-gray-900">
                      {formatCurrency(workOrder.invoice.payments.reduce((sum, payment) => sum + payment.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-sm font-medium text-gray-700">Recent Payments</h3>
                </div>
                {workOrder.invoice.payments.length === 0 ? (
                  <p className="text-sm text-gray-500">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {workOrder.invoice.payments.slice(0, 3).map(payment => (
                      <div key={payment.id} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</span>
                          <span className="text-sm text-gray-500">{formatDate(payment.date)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          via {payment.method.replace(/_/g, ' ')}
                          {payment.reference && ` (${payment.reference})`}
                        </div>
                      </div>
                    ))}
                    {workOrder.invoice.payments.length > 3 && (
                      <Link
                        href={`/invoices/${workOrder.invoice.id}`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View all payments
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}