// src/types/invoice.ts
export type InvoiceStatus = 
  | 'PENDING'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  customerId: string;
  workOrderId: string;
  createdAt: Date;
  updatedAt: Date;
  payments: Payment[];
};

export type PaymentMethod = 
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CHECK'
  | 'BANK_TRANSFER'
  | 'ONLINE_PAYMENT';

export type Payment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  date: Date;
  notes?: string;
  invoiceId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceFormData = Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'payments'>;