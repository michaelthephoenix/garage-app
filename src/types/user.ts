// src/types/user.ts
export type UserRole = 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'STAFF';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export type UserFormData = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
};