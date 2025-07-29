export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  creditLimit: number;
  currentDebt: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  vendorName: string;
  clientId: string;
  clientName: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'credito';
  status: 'completed' | 'pending';
  createdAt: Date;
}

export interface CreditTransaction {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  type: 'debt' | 'payment';
  paymentMethod?: 'efectivo' | 'transferencia';
  description: string;
  createdAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  role: string;
  icon: string;
}
