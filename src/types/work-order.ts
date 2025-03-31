// src/types/work-order.ts
export type WorkOrderStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELED';

export type WorkOrder = {
  id: string;
  orderNumber: string;
  status: WorkOrderStatus;
  description: string;
  diagnosticNotes?: string;
  startDate: Date;
  completionDate?: Date;
  customerId: string;
  vehicleId: string;
  technicianId?: string;
  createdAt: Date;
  updatedAt: Date;
  lineItems: WorkOrderLineItem[];
};

export type WorkOrderLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  laborHours?: number;
  laborRate?: number;
  partId?: string;
  workOrderId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkOrderFormData = Omit<WorkOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'lineItems'> & {
  lineItems: Omit<WorkOrderLineItem, 'id' | 'workOrderId' | 'createdAt' | 'updatedAt'>[];
};