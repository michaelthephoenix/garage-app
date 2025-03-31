
// src/types/customer.ts
export type Customer = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type CustomerFormData = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;