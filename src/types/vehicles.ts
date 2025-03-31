// src/types/vehicle.ts
export type Vehicle = {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    licensePlate?: string;
    color?: string;
    mileage?: number;
    notes?: string;
    customerId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type VehicleFormData = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;