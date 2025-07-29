import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/firebase';

interface InventoryProps {
  onShowNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const Inventory: React.FC<InventoryProps> = ({ onShowNotification }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    minStock: 10,
    icon: '🍦'
  });
  const [restockQuantity, setRestockQuantity] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      onShowNotification('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      onShowNotification('❌ Por favor complete todos los campos correctamente', 'error');
      return;
    }

    try {
      await addProduct(newProduct);
      await loadProducts();
      setShowAddModal(false);
      setNewProduct({ name: '', price: 0, stock: 0, minStock: 10, icon: '🍦' });
      onShowNotification('✅ Producto agregado exitosamente');
    } catch (error) {
      console.error('Error adding product:', error);
      onShowNotification('❌ Error al agregar producto', 'error');
    }
  };

  const handleRestock = async () => {
    if (!selectedProduct || restockQuantity <= 0) {
      onShowNotification('❌ Cantidad inválida', 'error');
      return;
    }

    try {
      await updateProduct(selectedProduct.id, {
        stock: selectedProduct.stock + restockQuantity
      });
      await loadProducts();
      setShowRestockModal(false);
      setRestockQuantity(0);
      setSelectedProduct(null);
      onShowNotification(`✅ Stock actualizado: +${restockQuantity} unidades`);
    } catch (error) {
      console.error('Error restocking product:', error);
      onShowNotification('❌ Error al actualizar stock', 'error');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`¿Está seguro de eliminar ${product.name}?`)) {
      try {
        await deleteProduct(product.id);
        await loadProducts();
        onShowNotification('✅ Producto eliminado');
      } catch (error) {
        console.error('Error deleting product:', error);
        onShowNotification('❌ Error al eliminar producto', 'error');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(product => product.stock <= product.minStock);

  if (loading) {
    return <div>Cargando inventario...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '25px' }}>📦 Control de Inventario</h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '300px',
            padding: '12px 20px',
            border: '2px solid #e0e0e0',
            borderRadius: '25px',
            fontSize: '16px',
            marginBottom: '0'
          }}
        />
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '14px 28px',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ➕ Agregar Producto
        </button>
      </div>
      
      {lowStockProducts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd, #ffeaa7)',
          border: '2px solid #ffc107',
          color: '#856404',
          padding: '20px',
          borderRadius: '15px',
          marginBottom: '25px'
        }}>
          <strong>⚠️ Productos con stock bajo:</strong><br />
          {lowStockProducts.map(product => `${product.name} (${product.stock} unidades)`).join(', ')} - Se recomienda reabastecer
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>🍦 Producto</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>💰 Precio</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>📦 Stock</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>📊 Estado</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>⚙️ Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => (
            <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6', background: product.stock <= product.minStock ? 'rgba(255, 107, 107, 0.1)' : 'white' }}>
              <td style={{ padding: '15px 12px' }}>
                {product.icon} {product.name}
              </td>
              <td style={{ padding: '15px 12px' }}>${product.price.toFixed(2)}</td>
              <td style={{ padding: '15px 12px' }}>{product.stock}</td>
              <td style={{ padding: '15px 12px' }}>
                {product.stock <= product.minStock ? (
                  <span style={{ color: '#e74c3c' }}>⚠️ Stock Bajo</span>
                ) : (
                  <span style={{ color: '#27ae60' }}>✅ Stock OK</span>
                )}
              </td>
              <td style={{ padding: '15px 12px' }}>
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowRestockModal(true);
                  }}
                  style={{
                    padding: '8px 12px',
                    marginRight: '5px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  📦 +Stock
                </button>
                <button
                  onClick={() => handleDeleteProduct(product)}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          ))}
          {filteredProducts.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No se encontraron productos
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          zIndex: 2000,
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            margin: '5% auto',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>➕ Agregar Nuevo Producto</h3>
              <span
                onClick={() => setShowAddModal(false)}
                style={{ color: '#aaa', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                &times;
              </span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>🍦 Nombre del Producto</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="Ej: Helado de Pistacho"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>💰 Precio</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>📦 Stock Inicial</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: 'white'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>⚠️ Stock Mínimo</label>
              <input
                type="number"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) || 10 })}
                placeholder="10"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>🎨 Icono</label>
              <select
                value={newProduct.icon}
                onChange={(e) => setNewProduct({ ...newProduct, icon: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="🍦">🍦 Helado</option>
                <option value="🍫">🍫 Chocolate</option>
                <option value="🍓">🍓 Fresa</option>
                <option value="🍪">🍪 Cookies</option>
                <option value="🌿">🌿 Menta</option>
                <option value="🥭">🥭 Mango</option>
                <option value="🍋">🍋 Limón</option>
                <option value="🥥">🥥 Coco</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
              <button
                onClick={handleAddProduct}
                style={{
                  flex: 1,
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
                ✅ Agregar Producto
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '14px 28px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #ffeaa7, #fdcb6e)',
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          zIndex: 2000,
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            margin: '10% auto',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>📦 Reabastecer Stock</h3>
              <span
                onClick={() => setShowRestockModal(false)}
                style={{ color: '#aaa', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                &times;
              </span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Producto</label>
              <input
                type="text"
                value={`${selectedProduct.icon} ${selectedProduct.name}`}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#f8f9fa'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Stock Actual</label>
              <input
                type="text"
                value={selectedProduct.stock}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#f8f9fa'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Cantidad a Agregar</label>
              <input
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
              <button
                onClick={handleRestock}
                style={{
                  flex: 1,
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
                ✅ Confirmar
              </button>
              <button
                onClick={() => setShowRestockModal(false)}
                style={{
                  flex: 1,
                  padding: '14px 28px',
                  border: 'none',
                  borderRadius: '12px',
                  background: 'linear-gradient(45deg, #ffeaa7, #fdcb6e)',
                  color: '#333',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
