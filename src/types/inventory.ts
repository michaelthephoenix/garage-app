// src/types/inventory.ts
export type InventoryItem = {
    id: string;
    partNumber: string;
    name: string;
    description?: string;
    category: string;
    manufacturer?: string;
    location?: string;
    quantity: number;
    minQuantity: number;
    costPrice: number;
    sellingPrice: number;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type InventoryItemFormData = Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>;
  
  export type TransactionType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  
  export type InventoryTransaction = {
    id: string;
    type: TransactionType;
    quantity: number;
    notes?: string;
    inventoryItemId: string;
    createdAt: Date;
    updatedBy?: string;
  };