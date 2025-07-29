// Configuración de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyD-WV5eeZ-9DpTBYFFNr9_Q29Dg_hMyU6w",
    authDomain: "heladeria-pos.firebaseapp.com",
    databaseURL: "https://heladeria-pos-default-rtdb.firebaseio.com",
    projectId: "heladeria-pos",
    storageBucket: "heladeria-pos.appspot.com",
    messagingSenderId: "171441568131",
    appId: "1:171441568131:web:6f730a3e64b79735815eb6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Funciones de Firebase
export const firebaseOperations = {
    // Productos
    addProduct: async (product) => {
        const newId = 'H' + Date.now().toString().slice(-3);
        return set(ref(db, 'products/' + newId), { ...product, id: newId });
    },
    
    getProducts: (callback) => {
        const productsRef = ref(db, 'products');
        return onValue(productsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },
    
    updateProduct: (id, updates) => {
        return update(ref(db, 'products/' + id), updates);
    },
    
    deleteProduct: (id) => {
        return remove(ref(db, 'products/' + id));
    },
    
    // Ventas
    addSale: async (sale) => {
        return set(push(ref(db, 'sales')), sale);
    },
    
    getSales: (callback) => {
        const salesRef = ref(db, 'sales');
        return onValue(salesRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },
    
    deleteSale: (key) => {
        return remove(ref(db, 'sales/' + key));
    },
    
    // Clientes
    addClient: async (client) => {
        return set(push(ref(db, 'clients')), client);
    },
    
    getClients: (callback) => {
        const clientsRef = ref(db, 'clients');
        return onValue(clientsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },
    
    // Créditos
    addCredit: async (clientKey, credit) => {
        return set(ref(db, 'credits/' + clientKey), credit);
    },
    
    getCredits: (callback) => {
        const creditsRef = ref(db, 'credits');
        return onValue(creditsRef, (snapshot) => {
            callback(snapshot.val() || {});
        });
    },
    
    deleteCredit: (clientKey) => {
        return remove(ref(db, 'credits/' + clientKey));
    }
};

export { db }; 