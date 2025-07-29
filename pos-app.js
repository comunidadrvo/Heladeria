// Importar operaciones de Firebase
import { firebaseOperations } from './firebase-config.js';

// Variables globales
let currentUser = '';
let cart = [];
let selectedPaymentMethod = 'efectivo';
let products = {};
let clients = {};
let sales = {};

// Sistema de navegación
class Navigation {
    static init() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                Navigation.switchSection(this);
            });
        });
    }

    static switchSection(button) {
        // Remover clase active de todos los botones
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // Agregar clase active al botón clickeado
        button.classList.add('active');
        
        // Determinar qué sección mostrar
        let sectionId = 'dashboard';
        if (button.textContent.includes('Punto de Venta')) sectionId = 'pos';
        else if (button.textContent.includes('Inventario')) sectionId = 'inventory';
        else if (button.textContent.includes('Créditos')) sectionId = 'credits';
        
        // Ocultar todas las secciones
        document.querySelectorAll('.subsection').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Renderizar contenido específico
            switch(sectionId) {
                case 'inventory':
                    setTimeout(() => Inventory.render(), 100);
                    break;
                case 'credits':
                    setTimeout(() => Credits.render(), 100);
                    break;
                case 'pos':
                    setTimeout(() => POS.renderProducts(), 100);
                    break;
            }
        }
    }
}

// Sistema de inventario
class Inventory {
    static render() {
        const tbody = document.querySelector('#inventory tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (Object.keys(products).length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay productos registrados</td></tr>';
            return;
        }
        
        Object.values(products).forEach(product => {
            const tr = document.createElement('tr');
            if (product.stock <= product.minStock) {
                tr.style.background = 'rgba(255, 107, 107, 0.1)';
            }
            
            tr.innerHTML = `
                <td>${product.icon || '🍦'} ${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td><span style="color: ${product.stock <= product.minStock ? '#e74c3c' : '#27ae60'};">${product.stock <= product.minStock ? '⚠️ Stock Bajo' : '✅ Stock OK'}</span></td>
                <td>
                    <button class="btn btn-primary" style="padding: 8px 12px; margin-right: 5px;" onclick="Inventory.restock('${product.id}')">📦 +Stock</button>
                    <button class="btn btn-warning" style="padding: 8px 12px; margin-right: 5px;" onclick="Inventory.edit('${product.id}')">✏️ Editar</button>
                    <button class="btn btn-danger" style="padding: 8px 12px;" onclick="Inventory.delete('${product.id}')">🗑️ Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    static async add() {
        const nameInput = document.querySelector('#addProductModal input[placeholder="Ej: Helado de Pistacho"]');
        const priceInput = document.querySelector('#addProductModal input[placeholder="0.00"]');
        const stockInput = document.querySelector('#addProductModal input[placeholder="0"]');
        const minStockInput = document.querySelector('#addProductModal input[placeholder="10"]');
        
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const stock = parseInt(stockInput.value);
        const minStock = parseInt(minStockInput.value);
        
        if (!name || isNaN(price) || isNaN(stock) || isNaN(minStock)) {
            showNotification('❌ Complete todos los campos correctamente', 'error');
            return;
        }
        
        try {
            await firebaseOperations.addProduct({
                name,
                price,
                stock,
                minStock,
                icon: '🍦'
            });
            
            showNotification('✅ Producto agregado exitosamente');
            
            // Limpiar campos
            nameInput.value = '';
            priceInput.value = '';
            stockInput.value = '';
            minStockInput.value = '';
            
            closeModal();
        } catch (error) {
            showNotification('❌ Error al agregar producto: ' + error.message, 'error');
        }
    }

    static async delete(id) {
        if (confirm('¿Seguro que deseas eliminar este producto?')) {
            try {
                await firebaseOperations.deleteProduct(id);
                showNotification('🗑️ Producto eliminado exitosamente');
            } catch (error) {
                showNotification('❌ Error al eliminar producto: ' + error.message, 'error');
            }
        }
    }

    static async restock(id) {
        const quantity = prompt('¿Cuántas unidades desea agregar al stock?');
        if (quantity && !isNaN(quantity) && quantity > 0) {
            try {
                const product = products[id];
                await firebaseOperations.updateProduct(id, { 
                    stock: product.stock + parseInt(quantity) 
                });
                showNotification(`📦 Stock actualizado: +${quantity} unidades`);
            } catch (error) {
                showNotification('❌ Error al actualizar stock: ' + error.message, 'error');
            }
        }
    }

    static async edit(id) {
        const product = products[id];
        const name = prompt('Nuevo nombre:', product.name);
        const price = parseFloat(prompt('Nuevo precio:', product.price));
        const stock = parseInt(prompt('Nuevo stock:', product.stock));
        const minStock = parseInt(prompt('Nuevo stock mínimo:', product.minStock));
        
        if (!name || isNaN(price) || isNaN(stock) || isNaN(minStock)) return;
        
        try {
            await firebaseOperations.updateProduct(id, { name, price, stock, minStock });
            showNotification('✏️ Producto editado exitosamente');
        } catch (error) {
            showNotification('❌ Error al editar producto: ' + error.message, 'error');
        }
    }
}

// Sistema de POS
class POS {
    static renderProducts() {
        const grid = document.querySelector('.products-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        Object.values(products).forEach(product => {
            const btn = document.createElement('button');
            btn.className = 'product-card' + (product.stock <= product.minStock ? ' low-stock' : '');
            btn.onclick = () => POS.addToCart(product);
            btn.innerHTML = `
                <div class="product-icon">${product.icon || '🍦'}</div>
                <div><strong>${product.name}</strong></div>
                <div>$${product.price.toFixed(2)}</div>
                <div>Stock: ${product.stock}${product.stock <= product.minStock ? ' ⚠️' : ''}</div>
            `;
            grid.appendChild(btn);
        });
    }

    static addToCart(product) {
        if (product.stock <= 0) {
            showNotification('❌ Producto sin stock disponible', 'error');
            return;
        }
        
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                showNotification('❌ No hay suficiente stock disponible', 'error');
                return;
            }
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                maxStock: product.stock
            });
        }
        
        POS.renderCart();
        showNotification(`✅ ${product.name} agregado al carrito`);
    }

    static renderCart() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;
        
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    $${item.price.toFixed(2)} c/u
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="POS.changeQuantity(${index}, -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="POS.changeQuantity(${index}, 1)">+</button>
                    <button onclick="POS.removeFromCart(${index})" style="margin-left: 10px; background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;">🗑️</button>
                </div>
            `;
            
            cartItems.appendChild(cartItem);
            total += item.price * item.quantity;
        });
        
        document.querySelector('.cart-total').textContent = `Total: $${total.toFixed(2)}`;
    }

    static changeQuantity(index, change) {
        const item = cart[index];
        const product = products[item.id];
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            POS.removeFromCart(index);
            return;
        }
        
        if (newQuantity > product.stock) {
            showNotification('❌ No hay suficiente stock disponible', 'error');
            return;
        }
        
        item.quantity = newQuantity;
        POS.renderCart();
    }

    static removeFromCart(index) {
        const item = cart[index];
        cart.splice(index, 1);
        POS.renderCart();
        showNotification(`🗑️ ${item.name} eliminado del carrito`);
    }

    static clearCart() {
        cart = [];
        POS.renderCart();
        showNotification('🗑️ Carrito limpiado');
    }

    static async processSale() {
        if (cart.length === 0) {
            showNotification('❌ El carrito está vacío', 'error');
            return;
        }
        
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
        });
        
        const clientSelect = document.querySelector('.cart select.form-control');
        const client = clientSelect ? clientSelect.value : '';
        const now = new Date();
        
        const sale = {
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            vendor: currentUser,
            client,
            products: cart.map(item => ({ name: item.name, quantity: item.quantity })),
            total,
            paymentMethod: selectedPaymentMethod,
            timestamp: now.getTime()
        };
        
        try {
            // Verificar stock antes de vender
            const updates = {};
            let stockOk = true;
            
            cart.forEach(item => {
                const product = products[item.id];
                if (product.stock < item.quantity) stockOk = false;
                updates[`products/${item.id}/stock`] = product.stock - item.quantity;
            });
            
            if (!stockOk) {
                showNotification('❌ Stock insuficiente para uno o más productos', 'error');
                return;
            }
            
            // Guardar venta y actualizar stock
            await firebaseOperations.addSale(sale);
            await update(ref(db), updates);
            
            POS.clearCart();
            showNotification(`✅ Venta procesada: $${total.toFixed(2)} (${selectedPaymentMethod})`);
        } catch (error) {
            showNotification('❌ Error al procesar venta: ' + error.message, 'error');
        }
    }
}

// Sistema de créditos
class Credits {
    static render() {
        const tbody = document.querySelector('#credits tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        firebaseOperations.getCredits((credits) => {
            Object.entries(credits).forEach(([clientKey, credit]) => {
                const client = clients[clientKey];
                if (!client) return;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${client.name}</strong><br><small>📞 ${client.phone || ''}</small></td>
                    <td><strong style="color: #e74c3c;">$${(credit.total || 0).toFixed(2)}</strong></td>
                    <td>${credit.lastDate || ''}</td>
                    <td><span style="color: #f39c12;">⏰ Pendiente</span></td>
                    <td>
                        <button class="btn btn-success" style="padding: 8px 12px; margin-right: 5px;" onclick="Credits.processPayment('${clientKey}')">💰 Pagar</button>
                        <button class="btn btn-primary" style="padding: 8px 12px; margin-right: 5px;" onclick="Credits.viewHistory('${clientKey}')">📋 Historial</button>
                        <button class="btn btn-danger" style="padding: 8px 12px;" onclick="Credits.delete('${clientKey}')">🗑️ Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    }

    static async delete(clientKey) {
        if (confirm('¿Seguro que deseas eliminar la deuda de este cliente?')) {
            try {
                await firebaseOperations.deleteCredit(clientKey);
                showNotification('🗑️ Deuda eliminada exitosamente');
            } catch (error) {
                showNotification('❌ Error al eliminar deuda: ' + error.message, 'error');
            }
        }
    }

    static async processPayment(clientKey) {
        const amount = parseFloat(prompt('Monto a pagar:'));
        if (!amount || isNaN(amount) || amount <= 0) return;
        
        try {
            // Obtener crédito actual
            const credit = await firebaseOperations.getCredits((credits) => {
                const currentCredit = credits[clientKey];
                if (currentCredit) {
                    const newTotal = currentCredit.total - amount;
                    firebaseOperations.addCredit(clientKey, {
                        total: newTotal,
                        lastDate: new Date().toISOString().slice(0, 10),
                        history: [...(currentCredit.history || []), { amount: -amount, date: new Date().toISOString().slice(0, 10) }]
                    });
                }
            });
            
            showNotification('💰 Pago registrado exitosamente');
        } catch (error) {
            showNotification('❌ Error al procesar pago: ' + error.message, 'error');
        }
    }

    static viewHistory(clientKey) {
        alert('Historial de crédito disponible en Firebase');
    }
}

// Sistema de ventas
class Sales {
    static renderRecent() {
        const tbody = document.getElementById('recentSalesTable');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        firebaseOperations.getSales((salesObj) => {
            const sales = Object.entries(salesObj).sort((a, b) => b[1].timestamp - a[1].timestamp).slice(0, 10);
            
            sales.forEach(([key, sale]) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${sale.time}</td>
                    <td>${sale.vendor}</td>
                    <td>${sale.client || 'Cliente General'}</td>
                    <td>${sale.products.map(p => `${p.name} (${p.quantity})`).join(', ')}</td>
                    <td>$${sale.total.toFixed(2)}</td>
                    <td>${sale.paymentMethod}</td>
                    <td><button class="btn btn-danger" style="padding: 6px 10px;" onclick="Sales.delete('${key}')">🗑️</button></td>
                `;
                tbody.appendChild(tr);
            });
        });
    }

    static async delete(key) {
        if (confirm('¿Seguro que deseas eliminar esta venta?')) {
            try {
                await firebaseOperations.deleteSale(key);
                showNotification('🗑️ Venta eliminada exitosamente');
                setTimeout(() => Sales.renderRecent(), 500);
            } catch (error) {
                showNotification('❌ Error al eliminar venta: ' + error.message, 'error');
            }
        }
    }
}

// Funciones de utilidad
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function closeModal() {
    document.getElementById('addProductModal').style.display = 'none';
}

function showAddProductModal() {
    document.getElementById('addProductModal').style.display = 'block';
}

// Login y navegación
function loginVendor() {
    if (currentUser) {
        document.getElementById('currentUser').textContent = currentUser;
        showSection('mainSystem');
        showNotification(`👋 Bienvenido ${currentUser}!`);
    }
}

function logout() {
    currentUser = '';
    cart = [];
    showSection('loginSection');
    showNotification('👋 Sesión cerrada correctamente');
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    if (sectionId === 'mainSystem') {
        document.querySelectorAll('.subsection').forEach(section => section.classList.remove('active'));
        document.getElementById('dashboard').classList.add('active');
    }
}

// Exponer funciones globales
window.Navigation = Navigation;
window.Inventory = Inventory;
window.POS = POS;
window.Credits = Credits;
window.Sales = Sales;
window.loginVendor = loginVendor;
window.logout = logout;
window.showSection = showSection;
window.closeModal = closeModal;
window.showAddProductModal = showAddProductModal;
window.addProduct = Inventory.add;
window.deleteProduct = Inventory.delete;
window.restockProduct = Inventory.restock;
window.editProduct = Inventory.edit;
window.addToCart = POS.addToCart;
window.changeQuantity = POS.changeQuantity;
window.removeFromCart = POS.removeFromCart;
window.clearCart = POS.clearCart;
window.processSale = POS.processSale;
window.deleteSale = Sales.delete;
window.deleteCredit = Credits.delete;
window.processPayment = Credits.processPayment;
window.viewCreditHistory = Credits.viewHistory;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos
    firebaseOperations.getProducts((productsData) => {
        products = productsData;
        POS.renderProducts();
        Inventory.render();
    });
    
    firebaseOperations.getClients((clientsData) => {
        clients = clientsData;
    });
    
    firebaseOperations.getSales((salesData) => {
        sales = salesData;
        Sales.renderRecent();
    });
    
    // Inicializar navegación
    Navigation.init();
    
    // Selección de vendedor
    const vendorCards = document.querySelectorAll('.vendor-card');
    const loginBtn = document.getElementById('loginBtn');

    vendorCards.forEach(card => {
        card.addEventListener('click', function() {
            vendorCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            loginBtn.disabled = false;
            currentUser = this.dataset.vendor;
        });
    });

    // Selección de método de pago
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
            this.classList.add('selected');
            selectedPaymentMethod = this.dataset.method || 'efectivo';
        });
    });
}); 