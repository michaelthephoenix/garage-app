// src/types/appointment.ts
export type AppointmentStatus = 
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

export type Appointment = {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  customerId: string;
  vehicleId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AppointmentFormData = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;