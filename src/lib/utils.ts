// src/lib/utils.ts
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

// Combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date
export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Generate a random order number
export function generateOrderNumber(): string {
  const prefix = 'WO';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
}

// Generate a random invoice number
export function generateInvoiceNumber(): string {
  const prefix = 'INV';
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

// Calculate subtotal from line items
export function calculateSubtotal(lineItems: Array<{
  quantity: number;
  unitPrice: number;
  laborHours?: number | null;
  laborRate?: number | null;
}>): number {
  return lineItems.reduce((total, item) => {
    const partsCost = item.quantity * item.unitPrice;
    const laborCost = item.laborHours && item.laborRate 
      ? item.laborHours * item.laborRate 
      : 0;
    return total + partsCost + laborCost;
  }, 0);
}

// Calculate tax
export function calculateTax(subtotal: number, taxRate: number = 0.0875): number {
  return subtotal * taxRate;
}

// Calculate total
export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

// Convert decimal hours to hours and minutes
export function formatHoursToHoursAndMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

// Check if an object is empty
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

// Sort by date
export function sortByDate<T extends { createdAt: Date | string }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

// Filter function for search
export function filterItems<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm) return items;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearchTerm);
    })
  );
}

// Get full customer name
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

// Get vehicle display name
export function getVehicleDisplayName(make: string, model: string, year: number): string {
  return `${year} ${make} ${model}`;
}

// Get status color
export function getStatusColor(
  status: string,
  type: 'bg' | 'text' | 'border' = 'bg'
): string {
  const colors: Record<string, Record<string, string>> = {
    // Work order status colors
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'IN_PROGRESS': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'WAITING_FOR_PARTS': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'INVOICED': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    'PAID': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'CANCELED': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    
    // Invoice status colors
    'SENT': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'PARTIALLY_PAID': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
    'OVERDUE': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    'VOID': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
    
    // Appointment status colors
    'SCHEDULED': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
    'CONFIRMED': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
    'NO_SHOW': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    
    // Default color
    'DEFAULT': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  };

  return colors[status]?.[type] || colors['DEFAULT'][type];
}