import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, Client, Sale, CreditTransaction } from '../types';

// Products
export const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, 'products'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Clients
export const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

export const getClients = async (): Promise<Client[]> => {
  try {
    const q = query(collection(db, 'clients'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Client[];
  } catch (error) {
    console.error('Error getting clients:', error);
    return [];
  }
};

export const updateClient = async (id: string, updates: Partial<Client>) => {
  try {
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Sales
export const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>) => {
  try {
    const batch = writeBatch(db);
    
    // Add sale
    const saleRef = doc(collection(db, 'sales'));
    batch.set(saleRef, {
      ...sale,
      createdAt: Timestamp.now()
    });
    
    // Update product stock
    for (const item of sale.items) {
      const productRef = doc(db, 'products', item.id);
      batch.update(productRef, {
        stock: item.maxStock - item.quantity,
        updatedAt: Timestamp.now()
      });
    }
    
    // If credit sale, update client debt
    if (sale.paymentMethod === 'credito') {
      const clientRef = doc(db, 'clients', sale.clientId);
      batch.update(clientRef, {
        currentDebt: sale.total,
        updatedAt: Timestamp.now()
      });
      
      // Add credit transaction
      const creditRef = doc(collection(db, 'creditTransactions'));
      batch.set(creditRef, {
        clientId: sale.clientId,
        clientName: sale.clientName,
        amount: sale.total,
        type: 'debt',
        description: `Venta a crédito - Productos: ${sale.items.map(i => i.name).join(', ')}`,
        createdAt: Timestamp.now()
      });
    }
    
    await batch.commit();
    return saleRef.id;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

export const getSales = async (limit?: number): Promise<Sale[]> => {
  try {
    let q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Sale[];
    
    return limit ? sales.slice(0, limit) : sales;
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
};

export const getTodaySales = async (): Promise<Sale[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const q = query(
      collection(db, 'sales'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      where('createdAt', '<', Timestamp.fromDate(tomorrow)),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Sale[];
  } catch (error) {
    console.error('Error getting today sales:', error);
    return [];
  }
};

// Credit Transactions
export const addCreditPayment = async (payment: Omit<CreditTransaction, 'id' | 'createdAt'>) => {
  try {
    const batch = writeBatch(db);
    
    // Add credit transaction
    const creditRef = doc(collection(db, 'creditTransactions'));
    batch.set(creditRef, {
      ...payment,
      createdAt: Timestamp.now()
    });
    
    // Update client debt
    const clientRef = doc(db, 'clients', payment.clientId);
    batch.update(clientRef, {
      currentDebt: Math.max(0, payment.amount), // Assuming amount is the new debt amount
      updatedAt: Timestamp.now()
    });
    
    await batch.commit();
    return creditRef.id;
  } catch (error) {
    console.error('Error adding credit payment:', error);
    throw error;
  }
};

export const getCreditTransactions = async (clientId?: string): Promise<CreditTransaction[]> => {
  try {
    let q = query(collection(db, 'creditTransactions'), orderBy('createdAt', 'desc'));
    
    if (clientId) {
      q = query(
        collection(db, 'creditTransactions'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as CreditTransaction[];
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    return [];
  }
};
