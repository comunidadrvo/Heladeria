import React, { useState, useEffect } from 'react';
import { Product, CartItem, Client, Vendor, Sale } from '../types';
import { getProducts, getClients, addSale } from '../services/firebase';

interface PointOfSaleProps {
  currentUser: Vendor;
  onShowNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const PointOfSale: React.FC<PointOfSaleProps> = ({ currentUser, onShowNotification }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito'>('efectivo');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, clientsData] = await Promise.all([
        getProducts(),
        getClients()
      ]);
      setProducts(productsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading POS data:', error);
      onShowNotification('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      onShowNotification('❌ Producto sin stock disponible', 'error');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        onShowNotification('❌ No hay suficiente stock disponible', 'error');
        return;
      }
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        maxStock: product.stock
      }]);
    }
    
    onShowNotification(`✅ ${product.name} agregado al carrito`);
  };

  const changeQuantity = (index: number, change: number) => {
    const item = cart[index];
    const newQuantity = item.quantity + change;
    
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    
    if (newQuantity > item.maxStock) {
      onShowNotification('❌ No hay suficiente stock disponible', 'error');
      return;
    }
    
    setCart(cart.map((cartItem, i) =>
      i === index ? { ...cartItem, quantity: newQuantity } : cartItem
    ));
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    onShowNotification(`🗑️ ${item.name} eliminado del carrito`);
  };

  const clearCart = () => {
    setCart([]);
    onShowNotification('🗑️ Carrito limpiado');
  };

  const processSale = async () => {
    if (cart.length === 0) {
      onShowNotification('❌ El carrito está vacío', 'error');
      return;
    }

    if (selectedPaymentMethod === 'credito' && !selectedClient) {
      onShowNotification('❌ Debe seleccionar un cliente para venta a crédito', 'error');
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const clientName = selectedClient ? clients.find(c => c.id === selectedClient)?.name || 'Cliente General' : 'Cliente General';

    const sale: Omit<Sale, 'id' | 'createdAt'> = {
      vendorName: currentUser.name,
      clientId: selectedClient || 'general',
      clientName,
      items: cart,
      total,
      paymentMethod: selectedPaymentMethod,
      status: 'completed'
    };

    try {
      await addSale(sale);
      clearCart();
      setSelectedClient('');
      setSelectedPaymentMethod('efectivo');
      onShowNotification(`✅ Venta procesada: $${total.toFixed(2)} (${selectedPaymentMethod})`);
      
      // Reload products to update stock
      const updatedProducts = await getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error processing sale:', error);
      onShowNotification('❌ Error al procesar la venta', 'error');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return <div>Cargando punto de venta...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '25px' }}>🛒 Punto de Venta</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', minHeight: '600px' }}>
        <div style={{ background: '#f8f9fa', borderRadius: '15px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>🍦 Productos Disponibles</h3>
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '250px',
                padding: '12px 20px',
                border: '2px solid #e0e0e0',
                borderRadius: '25px',
                fontSize: '16px',
                marginBottom: '0'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                style={{
                  background: product.stock <= product.minStock ? 
                    'linear-gradient(135deg, #ff6b6b 0%, #ffa8a8 100%)' : 
                    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  borderRadius: '15px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  color: product.stock <= product.minStock ? 'white' : '#333',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{product.icon}</div>
                <div><strong>{product.name}</strong></div>
                <div>${product.price.toFixed(2)}</div>
                <div>Stock: {product.stock} {product.stock <= product.minStock ? '⚠️' : ''}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '20px', padding: '25px', position: 'sticky', top: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #dee2e6' }}>
            <h3>🛒 Carrito</h3>
            <button
              onClick={clearCart}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(45deg, #ffeaa7, #fdcb6e)',
                color: '#333',
                cursor: 'pointer'
              }}
            >
              🗑️ Limpiar
            </button>
          </div>
          
          <div style={{ marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
            {cart.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #dee2e6' }}>
                <div>
                  <strong>{item.name}</strong><br />
                  ${item.price.toFixed(2)} c/u
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(102, 126, 234, 0.1)', padding: '8px 12px', borderRadius: '25px' }}>
                  <button
                    onClick={() => changeQuantity(index, -1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      borderRadius: '50%',
                      background: '#667eea',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => changeQuantity(index, 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      borderRadius: '50%',
                      background: '#667eea',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '18px'
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(index)}
                    style={{
                      marginLeft: '10px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Carrito vacío
              </div>
            )}
          </div>
          
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '25px 0',
            color: '#667eea',
            padding: '15px',
            background: 'rgba(102, 126, 234, 0.1)',
            borderRadius: '10px',
            border: '2px dashed #667eea'
          }}>
            Total: ${total.toFixed(2)}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>👤 Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                background: 'white'
              }}
            >
              <option value="">Cliente General</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '20px 0' }}>
            {(['efectivo', 'transferencia', 'credito'] as const).map(method => (
              <div
                key={method}
                onClick={() => setSelectedPaymentMethod(method)}
                style={{
                  padding: '18px 12px',
                  border: selectedPaymentMethod === method ? '2px solid #667eea' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: selectedPaymentMethod === method ? 'rgba(102, 126, 234, 0.1)' : 'white',
                  color: selectedPaymentMethod === method ? '#667eea' : '#333',
                  fontWeight: selectedPaymentMethod === method ? 'bold' : '500',
                  transition: 'all 0.3s ease'
                }}
              >
                {method === 'efectivo' ? '💵' : method === 'transferencia' ? '💳' : '📝'}
                <br />
                <strong>{method === 'efectivo' ? 'Efectivo' : method === 'transferencia' ? 'Transferencia' : 'Crédito'}</strong>
              </div>
            ))}
          </div>

          <button
            onClick={processSale}
            style={{
              width: '100%',
              marginBottom: '10px',
              padding: '14px 28px',
              border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💰 Procesar Venta
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
