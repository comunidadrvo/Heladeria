// Gestión de secciones del POS
import { firebaseOperations } from './firebase-config.js';

// Función de notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Estilos para la notificación
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '5px';
    notification.style.color = '#fff';
    notification.style.zIndex = '1000';
    
    // Establecer color de fondo según el tipo
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(notification);
    
    // Remover la notificación después de 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Variables globales para las secciones
let products = {};
let clients = {};
let sales = {};
let credits = {};
let cashRegister = {
    total: 0,
    lastUpdate: new Date()
};

// Clase para manejar el inventario
class InventorySection {
    static init() {
        this.loadProducts();
        this.setupEventListeners();
    }

    static loadProducts() {
        firebaseOperations.getProducts((productsData) => {
            products = productsData;
            this.render();
        });
    }

    static setupEventListeners() {
        // Botón agregar producto
        const addProductBtn = document.querySelector('#inventory .btn-primary');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showAddProductModal();
            });
        }

        // Búsqueda de productos
        const searchInput = document.querySelector('#inventory .search-bar');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }
    }

    static render() {
        const tbody = document.querySelector('#inventory tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de inventario');
            return;
        }

        tbody.innerHTML = '';

        if (Object.keys(products).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">📦</div>
                        <strong>No hay productos registrados</strong><br>
                        <small>Agrega tu primer producto usando el botón "Agregar Producto"</small>
                    </td>
                </tr>
            `;
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
                <td>
                    <span style="color: ${product.stock <= product.minStock ? '#e74c3c' : '#27ae60'};">
                        ${product.stock <= product.minStock ? '⚠️ Stock Bajo' : '✅ Stock OK'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-primary" style="padding: 8px 12px; margin-right: 5px;" 
                            onclick="InventorySection.restock('${product.id}')">📦 +Stock</button>
                    <button class="btn btn-warning" style="padding: 8px 12px; margin-right: 5px;" 
                            onclick="InventorySection.edit('${product.id}')">✏️ Editar</button>
                    <button class="btn btn-danger" style="padding: 8px 12px;" 
                            onclick="InventorySection.delete('${product.id}')">🗑️ Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    static showAddProductModal() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    static async addProduct() {
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
            
            this.closeModal();
        } catch (error) {
            showNotification('❌ Error al agregar producto: ' + error.message, 'error');
        }
    }

    static async delete(id) {
        if (confirm('¿Seguro que deseas eliminar este producto?')) {
            try {
                await firebaseOperations.deleteProduct(id);
                showNotification('🗑️ Producto eliminado exitosamente');
                this.render();
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
                this.render();
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
            this.render();
        } catch (error) {
            showNotification('❌ Error al editar producto: ' + error.message, 'error');
        }
    }

    static closeModal() {
        const modal = document.getElementById('addProductModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    static filterProducts(searchTerm) {
        const tbody = document.querySelector('#inventory tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const productName = row.querySelector('td:first-child').textContent.toLowerCase();
            if (productName.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

// Clase para manejar créditos
class CreditsSection {
    static init() {
        this.loadCredits();
        this.loadClients();
        this.setupEventListeners();
    }

    static loadCredits() {
        firebaseOperations.getCredits((creditsData) => {
            credits = creditsData;
            this.render();
        });
    }

    static loadClients() {
        firebaseOperations.getClients((clientsData) => {
            clients = clientsData;
        });
    }

    static setupEventListeners() {
        // Botón registrar pago
        const addPaymentBtn = document.querySelector('#credits .btn-success');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => {
                this.showAddPaymentModal();
            });
        }

        // Búsqueda de clientes
        const searchInput = document.querySelector('#credits .search-bar');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterClients(e.target.value);
            });
        }
    }

    static render() {
        const tbody = document.querySelector('#credits tbody');
        if (!tbody) {
            console.error('No se encontró la tabla de créditos');
            return;
        }

        // Agregar estilos para el modal y la tabla de historial
        const styles = document.createElement('style');
        styles.textContent = `
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }

            .modal-content {
                background-color: #fefefe;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                width: 80%;
                max-width: 500px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .modal-header h3 {
                margin: 0;
                color: #2c3e50;
            }

            .close {
                color: #aaa;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }

            .close:hover {
                color: #555;
            }

            .modal-body {
                padding: 10px 0;
            }

            .form-group {
                margin-bottom: 15px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                color: #555;
            }

            .form-control {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }

            .form-control:focus {
                border-color: #3498db;
                outline: none;
                box-shadow: 0 0 5px rgba(52,152,219,0.3);
            }

            .btn {
                padding: 8px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 10px;
            }

            .btn-primary {
                background-color: #3498db;
                color: white;
            }

            .btn-secondary {
                background-color: #95a5a6;
                color: white;
            }

            .btn:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(styles);
        if (!document.getElementById('credit-styles')) {
            const styles = document.createElement('style');
            styles.id = 'credit-styles';
            styles.textContent = `
                .modal {
                    display: flex;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 80%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .credit-history {
                    margin: 20px 0;
                }
                .credit-history table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .credit-history th, .credit-history td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }
                .credit-history .debit {
                    background-color: #ffe6e6;
                }
                .credit-history .credit {
                    background-color: #e6ffe6;
                }
            `;
            document.head.appendChild(styles);
        }

        tbody.innerHTML = '';

        // Agregar botón para nuevo cliente
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <td colspan="5" class="text-right" style="padding: 10px;">
                <button class="btn btn-primary" onclick="CreditsSection.addClient()">
                    ➕ Agregar Cliente
                </button>
            </td>
        `;
        tbody.appendChild(headerRow);

        if (Object.keys(credits).length === 0) {
            tbody.appendChild(document.createElement('tr')).innerHTML = `
                <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">💳</div>
                    <strong>No hay créditos pendientes</strong><br>
                    <small>Todos los clientes están al día con sus pagos</small>
                </td>
            `;
            return;
        }

        Object.entries(credits).forEach(([clientKey, credit]) => {
            const client = clients[clientKey];
            if (!client) return;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${client.name}</strong><br>
                    <small>📞 ${client.phone || 'Sin teléfono'}</small>
                </td>
                <td><strong style="color: #e74c3c;">$${(credit.total || 0).toFixed(2)}</strong></td>
                <td>${credit.lastDate || 'N/A'}</td>
                <td><span style="color: #f39c12;">⏰ Pendiente</span></td>
                <td>
                    <button class="btn btn-success" style="padding: 8px 12px; margin-right: 5px;" 
                            onclick="CreditsSection.processPayment('${clientKey}')">💰 Pagar</button>
                    <button class="btn btn-primary" style="padding: 8px 12px; margin-right: 5px;" 
                            onclick="CreditsSection.viewHistory('${clientKey}')">📋 Historial</button>
                    <button class="btn btn-danger" style="padding: 8px 12px;" 
                            onclick="CreditsSection.delete('${clientKey}')">🗑️ Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar resumen de créditos
        this.updateCreditsSummary();
    }

    static updateCreditsSummary() {
        const totalCredits = Object.values(credits).reduce((sum, credit) => sum + (credit.total || 0), 0);
        const clientCount = Object.keys(credits).length;
        const averageCredit = clientCount > 0 ? totalCredits / clientCount : 0;

        // Actualizar las tarjetas de resumen
        const totalElement = document.querySelector('#credits .stat-card:nth-child(1) .stat-value');
        const clientsElement = document.querySelector('#credits .stat-card:nth-child(2) .stat-value');
        const averageElement = document.querySelector('#credits .stat-card:nth-child(3) .stat-value');

        if (totalElement) totalElement.textContent = `$${totalCredits.toFixed(2)}`;
        if (clientsElement) clientsElement.textContent = clientCount;
        if (averageElement) averageElement.textContent = `$${averageCredit.toFixed(2)}`;
    }

    static async delete(clientKey) {
        if (confirm('¿Seguro que deseas eliminar la deuda de este cliente?')) {
            try {
                await firebaseOperations.deleteCredit(clientKey);
                showNotification('🗑️ Deuda eliminada exitosamente');
                this.render();
            } catch (error) {
                showNotification('❌ Error al eliminar deuda: ' + error.message, 'error');
            }
        }
    }

    static async processPayment(clientKey) {
        const credit = credits[clientKey];
        if (!credit) return;

        const amount = parseFloat(prompt(`Monto a pagar (Deuda total: $${credit.total.toFixed(2)}):`));
        if (!amount || isNaN(amount) || amount <= 0) return;

        try {
            // Verificar que el monto no exceda la deuda
            if (amount > credit.total) {
                showNotification('❌ El monto excede la deuda pendiente', 'error');
                return;
            }

            const newTotal = credit.total - amount;
            await firebaseOperations.updateCredit(clientKey, {
                total: newTotal,
                lastDate: new Date().toISOString().slice(0, 10),
                history: [...(credit.history || []), { 
                    amount: -amount, 
                    date: new Date().toISOString().slice(0, 10),
                    type: 'payment'
                }]
            });

            // Actualizar el dinero en caja
            const currentCash = cashRegister.total || 0;
            await firebaseOperations.updateCashRegister({
                total: currentCash + amount,
                lastUpdate: new Date().toISOString()
            });

            showNotification('💰 Pago registrado exitosamente');
            this.render();
            CashRegister.render(); // Actualizar la vista de la caja
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            showNotification('❌ Error al procesar pago: ' + error.message, 'error');
        }
    }

    static async addClient() {
        const name = prompt('Nombre del cliente:');
        if (!name) return;

        const phone = prompt('Teléfono del cliente (opcional):');

        try {
            const clientData = {
                name,
                phone: phone || '',
                createdAt: new Date().toISOString()
            };

            const clientRef = await firebaseOperations.addClient(clientData);
            showNotification('✅ Cliente agregado exitosamente');
            this.render();
        } catch (error) {
            console.error('Error al agregar cliente:', error);
            showNotification('❌ Error al agregar cliente: ' + error.message, 'error');
        }
    }

    static viewHistory(clientKey) {
        const credit = credits[clientKey];
        const client = clients[clientKey];
        if (!credit || !credit.history) {
            showNotification('❌ No hay historial disponible para este cliente', 'error');
            return;
        }

        // Crear modal para mostrar el historial
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Historial de Crédito - ${client.name}</h3>
                <div class="credit-history">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${credit.history.map(entry => {
                                const type = entry.amount > 0 ? '💳 Compra' : '💰 Pago';
                                const amount = Math.abs(entry.amount);
                                return `
                                    <tr class="${entry.amount > 0 ? 'debit' : 'credit'}">
                                        <td>${entry.date}</td>
                                        <td>${type}</td>
                                        <td>$${amount.toFixed(2)}</td>
                                        <td>$${entry.balance ? entry.balance.toFixed(2) : 'N/A'}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">Cerrar</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    static showAddPaymentModal() {
        const modalHtml = `
            <div id="paymentModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Registrar Pago</h3>
                        <span class="close" onclick="CreditsSection.closePaymentModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="clientName">Nombre del Cliente:</label>
                            <input type="text" id="clientName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentAmount">Monto del Pago:</label>
                            <input type="number" id="paymentAmount" class="form-control" min="0" step="0.01" required>
                        </div>
                        <button class="btn btn-primary" onclick="CreditsSection.processManualPayment()">Registrar Pago</button>
                        <button class="btn btn-secondary" onclick="CreditsSection.closePaymentModal()">Cancelar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.remove();
        }
    }

    static async processManualPayment() {
        const clientName = document.getElementById('clientName').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);

        if (!clientName || !amount || isNaN(amount) || amount <= 0) {
            showNotification('❌ Por favor complete todos los campos correctamente', 'error');
            return;
        }

        // Buscar cliente por nombre
        let clientKey = null;
        Object.entries(clients).forEach(([key, client]) => {
            if (client.name.toLowerCase() === clientName.toLowerCase()) clientKey = key;
        });

        if (!clientKey) {
            showNotification('❌ Cliente no encontrado', 'error');
            return;
        }

        await this.processPayment(clientKey, amount);
        this.closePaymentModal();
    }

    static async processPayment(clientKey, amount) {
        try {
            // Verificar si el cliente existe y tiene créditos
            if (!credits[clientKey]) {
                showNotification('❌ El cliente no tiene créditos pendientes', 'error');
                return;
            }

            // Obtener el saldo actual
            const currentBalance = credits[clientKey].balance || 0;

            // Verificar que el pago no exceda el saldo
            if (amount > currentBalance) {
                showNotification('❌ El pago excede el saldo pendiente', 'error');
                return;
            }

            // Crear entrada en el historial
            const paymentEntry = {
                date: new Date().toLocaleDateString(),
                amount: -amount, // Negativo porque es un pago
                type: 'payment'
            };

            // Actualizar el saldo y el historial
            const updates = {
                balance: currentBalance - amount,
                history: [...(credits[clientKey].history || []), paymentEntry]
            };

            // Actualizar en Firebase
            await firebaseOperations.updateCredit(clientKey, updates);

            showNotification('✅ Pago procesado correctamente', 'success');
            this.render(); // Actualizar la vista
        } catch (error) {
            console.error('Error al procesar el pago:', error);
            showNotification('❌ Error al procesar el pago', 'error');
        }
    }

    static filterClients(searchTerm) {
        const tbody = document.querySelector('#credits tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const clientName = row.querySelector('td:first-child strong').textContent.toLowerCase();
            if (clientName.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
}

// Clase para manejar el punto de venta
class POSSection {
    static init() {
        this.loadProducts();
        this.setupEventListeners();
    }

    static loadProducts() {
        firebaseOperations.getProducts((productsData) => {
            products = productsData;
            this.renderProducts();
        });
    }

    static setupEventListeners() {
        // Búsqueda de productos
        const searchInput = document.querySelector('#pos .search-bar');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }

        // Métodos de pago
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', function() {
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                this.classList.add('selected');
                // Determinar método de pago
                if (this.textContent.includes('Efectivo')) {
                    window.selectedPaymentMethod = 'efectivo';
                } else if (this.textContent.includes('Transferencia')) {
                    window.selectedPaymentMethod = 'transferencia';
                } else if (this.textContent.includes('Crédito')) {
                    window.selectedPaymentMethod = 'crédito';
                }
            });
        });
    }

    static renderProducts() {
        const grid = document.querySelector('.products-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (Object.keys(products).length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🍦</div>
                    <strong>No hay productos disponibles</strong><br>
                    <small>Agrega productos en la sección de Inventario</small>
                </div>
            `;
            return;
        }

        Object.values(products).forEach(product => {
            const btn = document.createElement('button');
            btn.className = 'product-card' + (product.stock <= product.minStock ? ' low-stock' : '');
            btn.onclick = () => this.addToCart(product);
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

        const existingItem = window.cart.find(item => item.id === product.id);

        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity++;
            } else {
                showNotification('❌ No hay suficiente stock disponible', 'error');
                return;
            }
        } else {
            window.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                maxStock: product.stock
            });
        }

        this.renderCart();
        showNotification(`✅ ${product.name} agregado al carrito`);
    }

    static renderCart() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        cartItems.innerHTML = '';
        let total = 0;

        window.cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    $${item.price.toFixed(2)} c/u
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="POSSection.changeQuantity(${index}, -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="POSSection.changeQuantity(${index}, 1)">+</button>
                    <button onclick="POSSection.removeFromCart(${index})" 
                            style="margin-left: 10px; background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;">🗑️</button>
                </div>
            `;

            cartItems.appendChild(cartItem);
            total += item.price * item.quantity;
        });

        const totalElement = document.querySelector('.cart-total');
        if (totalElement) {
            totalElement.textContent = `Total: $${total.toFixed(2)}`;
        }
    }

    static changeQuantity(index, change) {
        const item = window.cart[index];
        const product = products[item.id];
        const newQuantity = item.quantity + change;

        if (newQuantity <= 0) {
            this.removeFromCart(index);
            return;
        }

        if (newQuantity > product.stock) {
            showNotification('❌ No hay suficiente stock disponible', 'error');
            return;
        }

        item.quantity = newQuantity;
        this.renderCart();
    }

    static removeFromCart(index) {
        const item = window.cart[index];
        window.cart.splice(index, 1);
        this.renderCart();
        showNotification(`🗑️ ${item.name} eliminado del carrito`);
    }

    static clearCart() {
        window.cart = [];
        this.renderCart();
        showNotification('🗑️ Carrito limpiado');
    }

    static async processSale() {
        if (window.cart.length === 0) {
            showNotification('❌ El carrito está vacío', 'error');
            return;
        }

        let total = 0;
        window.cart.forEach(item => {
            total += item.price * item.quantity;
        });

        const clientSelect = document.querySelector('.cart select.form-control');
        const client = clientSelect ? clientSelect.value : '';
        const now = new Date();

        const sale = {
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            vendor: window.currentUser,
            client,
            products: window.cart.map(item => ({ name: item.name, quantity: item.quantity })),
            total,
            paymentMethod: window.selectedPaymentMethod || 'efectivo',
            timestamp: now.getTime()
        };

        try {
            // Verificar stock antes de vender
            const updates = {};
            let stockOk = true;

            window.cart.forEach(item => {
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
            await firebaseOperations.updateProduct('', updates); // Actualizar stock

            this.clearCart();
            showNotification(`✅ Venta procesada: $${total.toFixed(2)} (${window.selectedPaymentMethod})`);
        } catch (error) {
            showNotification('❌ Error al procesar venta: ' + error.message, 'error');
        }
    }

    static filterProducts(searchTerm) {
        const grid = document.querySelector('.products-grid');
        if (!grid) return;

        const buttons = grid.querySelectorAll('.product-card');
        buttons.forEach(btn => {
            const productName = btn.querySelector('div:nth-child(2) strong').textContent.toLowerCase();
            if (productName.includes(searchTerm.toLowerCase())) {
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        });
    }
}

// Clase para manejar el dinero disponible
class CashRegister {
    static init() {
        this.loadCashData();
        this.setupEventListeners();
    }

    static loadCashData() {
        // Cargar datos de caja desde Firebase
        firebaseOperations.getSales((salesData) => {
            this.calculateCashAvailable(salesData);
        });
    }

    static calculateCashAvailable(salesData) {
        const today = new Date().toISOString().slice(0, 10);
        let totalCash = 0;
        let totalSales = 0;

        Object.values(salesData || {}).forEach(sale => {
            const saleDate = new Date(sale.timestamp).toISOString().slice(0, 10);
            if (saleDate === today) {
                totalSales += sale.total;
                if (sale.paymentMethod === 'efectivo') {
                    totalCash += sale.total;
                }
            }
        });

        cashRegister.total = totalCash;
        cashRegister.lastUpdate = new Date();
        this.renderCashInfo();
    }

    static setupEventListeners() {
        // Botón entregar dinero
        const deliverBtn = document.getElementById('deliverCashBtn');
        if (deliverBtn) {
            deliverBtn.addEventListener('click', () => {
                this.deliverCash();
            });
        }
    }

    static renderCashInfo() {
        const cashElement = document.getElementById('availableCash');
        if (cashElement) {
            cashElement.textContent = `$${cashRegister.total.toFixed(2)}`;
        }

        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = cashRegister.lastUpdate.toLocaleString();
        }
    }

    static deliverCash() {
        if (cashRegister.total <= 0) {
            showNotification('❌ No hay dinero disponible para entregar', 'error');
            return;
        }

        const amount = parseFloat(prompt(`Monto a entregar (Disponible: $${cashRegister.total.toFixed(2)}):`));
        if (!amount || isNaN(amount) || amount <= 0) return;

        if (amount > cashRegister.total) {
            showNotification('❌ Monto excede el dinero disponible', 'error');
            return;
        }

        // Registrar entrega de dinero
        const delivery = {
            amount: amount,
            date: new Date().toISOString(),
            deliveredBy: window.currentUser,
            type: 'cash_delivery'
        };

        firebaseOperations.addSale(delivery).then(() => {
            cashRegister.total -= amount;
            this.renderCashInfo();
            showNotification(`💰 Entregado $${amount.toFixed(2)} al encargado`);
        }).catch((error) => {
            showNotification('❌ Error al registrar entrega: ' + error.message, 'error');
        });
    }
}

// La función showNotification ya está definida al inicio del archivo, eliminamos la duplicación

// Exponer funciones globales
window.InventorySection = InventorySection;
window.CreditsSection = CreditsSection;
window.POSSection = POSSection;
window.CashRegister = CashRegister;
window.addCreditPayment = CreditsSection.showAddPaymentModal;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todas las secciones
    InventorySection.init();
    CreditsSection.init();
    POSSection.init();
    CashRegister.init();
});