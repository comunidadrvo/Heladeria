import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

export const initializeData = async () => {
  try {
    // Initialize products
    const products = [
      { name: 'Vainilla', price: 3.00, stock: 50, minStock: 10, icon: '🍦' },
      { name: 'Chocolate', price: 3.00, stock: 45, minStock: 10, icon: '🍫' },
      { name: 'Fresa', price: 3.50, stock: 8, minStock: 10, icon: '🍓' },
      { name: 'Cookies & Cream', price: 4.00, stock: 25, minStock: 10, icon: '🍪' },
      { name: 'Menta', price: 3.50, stock: 20, minStock: 10, icon: '🌿' },
      { name: 'Mango', price: 3.75, stock: 35, minStock: 10, icon: '🥭' }
    ];

    // Initialize clients
    const clients = [
      { name: 'Ana Martínez', phone: '809-111-2222', email: 'ana@email.com', creditLimit: 100, currentDebt: 35 },
      { name: 'Luis Rodríguez', phone: '809-333-4444', email: 'luis@email.com', creditLimit: 150, currentDebt: 25.50 },
      { name: 'Carmen Soto', phone: '809-555-6666', email: 'carmen@email.com', creditLimit: 80, currentDebt: 25 }
    ];

    // Add products to Firestore
    for (const product of products) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Add clients to Firestore
    for (const client of clients) {
      await addDoc(collection(db, 'clients'), {
        ...client,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log('Initial data loaded successfully');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};
