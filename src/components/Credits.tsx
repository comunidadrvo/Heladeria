import React, { useState, useEffect } from 'react';
import { Client, CreditTransaction } from '../types';
import { getClients, getCreditTransactions, addCreditPayment, updateClient, addClient } from '../services/firebase';

interface CreditsProps {
  onShowNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const Credits: React.FC<CreditsProps> = ({ onShowNotification }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    creditLimit: 100
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, transactionsData] = await Promise.all([
        getClients(),
        getCreditTransactions()
      ]);
      setClients(clientsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading credits data:', error);
      onShowNotification('Error al cargar datos de créditos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.phone) {
      onShowNotification('❌ Nombre y teléfono son obligatorios', 'error');
      return;
    }

    try {
      await addClient({
        ...newClient,
        currentDebt: 0
      });
      await loadData();
      setShowAddClientModal(false);
      setNewClient({ name: '', phone: '', email: '', creditLimit: 100 });
      onShowNotification('✅ Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error adding client:', error);
      onShowNotification('❌ Error al agregar cliente', 'error');
    }
  };

  const handlePayment = async () => {
    if (!selectedClient || paymentAmount <= 0) {
      onShowNotification('❌ Datos de pago inválidos', 'error');
      return;
    }

    if (paymentAmount > selectedClient.currentDebt) {
      onShowNotification('❌ El pago no puede ser mayor a la deuda', 'error');
      return;
    }

    try {
      const newDebt = selectedClient.currentDebt - paymentAmount;
      
      // Add payment transaction
      await addCreditPayment({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount: paymentAmount,
        type: 'payment',
        paymentMethod,
        description: `Pago recibido - ${paymentMethod}`
      });

      // Update client debt
      await updateClient(selectedClient.id, { currentDebt: newDebt });

      await loadData();
      setShowPaymentModal(false);
      setPaymentAmount(0);
      setSelectedClient(null);
      onShowNotification(`✅ Pago registrado: $${paymentAmount.toFixed(2)}`);
    } catch (error) {
      console.error('Error processing payment:', error);
      onShowNotification('❌ Error al procesar pago', 'error');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const clientsWithDebt = clients.filter(client => client.currentDebt > 0);
  const totalDebt = clientsWithDebt.reduce((sum, client) => sum + client.currentDebt, 0);
  const averageDebt = clientsWithDebt.length > 0 ? totalDebt / clientsWithDebt.length : 0;

  if (loading) {
    return <div>Cargando sistema de créditos...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '25px' }}>💳 Gestión de Créditos</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '25px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>${totalDebt.toFixed(2)}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>💰 Total en Créditos</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>{clientsWithDebt.length}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>👥 Clientes con Deuda</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>${averageDebt.toFixed(2)}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>📊 Promedio por Cliente</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar cliente..."
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
        <button
          onClick={() => setShowAddClientModal(true)}
          style={{
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
          ➕ Agregar Cliente
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>👤 Cliente</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>💰 Deuda Total</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>💳 Límite</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>📊 Estado</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>⚙️ Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map(client => (
            <tr key={client.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '15px 12px' }}>
                <strong>{client.name}</strong><br />
                <small>📞 {client.phone}</small>
                {client.email && <><br /><small>📧 {client.email}</small></>}
              </td>
              <td style={{ padding: '15px 12px' }}>
                <strong style={{ color: client.currentDebt > 0 ? '#e74c3c' : '#27ae60' }}>
                  ${client.currentDebt.toFixed(2)}
                </strong>
              </td>
              <td style={{ padding: '15px 12px' }}>${client.creditLimit.toFixed(2)}</td>
              <td style={{ padding: '15px 12px' }}>
                {client.currentDebt > 0 ? (
                  <span style={{ color: '#f39c12' }}>⏰ Pendiente</span>
                ) : (
                  <span style={{ color: '#27ae60' }}>✅ Al día</span>
                )}
              </td>
              <td style={{ padding: '15px 12px' }}>
                {client.currentDebt > 0 && (
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowPaymentModal(true);
                    }}
                    style={{
                      padding: '8px 12px',
                      marginRight: '5px',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    💰 Pagar
                  </button>
                )}
                <button
                  onClick={() => onShowNotification('📋 Historial de créditos disponible')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  📋 Historial
                </button>
              </td>
            </tr>
          ))}
          {filteredClients.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No se encontraron clientes
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #e8f5e8, #d4edda)',
        borderRadius: '15px',
        borderLeft: '5px solid #28a745'
      }}>
        <h4 style={{ color: '#155724', marginBottom: '15px' }}>📊 Resumen de Créditos</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong>💰 Total por cobrar:</strong> ${totalDebt.toFixed(2)}
          </div>
          <div>
            <strong>👥 Total clientes:</strong> {clients.length}
          </div>
          <div>
            <strong>📊 Promedio de deuda:</strong> ${averageDebt.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
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
              <h3>➕ Agregar Nuevo Cliente</h3>
              <span
                onClick={() => setShowAddClientModal(false)}
                style={{ color: '#aaa', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                &times;
              </span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>👤 Nombre Completo *</label>
              <input
                type="text"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>📞 Teléfono *</label>
              <input
                type="tel"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                placeholder="809-123-4567"
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>📧 Email (opcional)</label>
              <input
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                placeholder="cliente@email.com"
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>💳 Límite de Crédito</label>
              <input
                type="number"
                step="0.01"
                value={newClient.creditLimit}
                onChange={(e) => setNewClient({ ...newClient, creditLimit: parseFloat(e.target.value) || 100 })}
                placeholder="100.00"
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
                onClick={handleAddClient}
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
                ✅ Agregar Cliente
              </button>
              <button
                onClick={() => setShowAddClientModal(false)}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedClient && (
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
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3>💰 Registrar Pago de Crédito</h3>
              <span
                onClick={() => setShowPaymentModal(false)}
                style={{ color: '#aaa', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                &times;
              </span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>👤 Cliente</label>
              <input
                type="text"
                value={selectedClient.name}
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>💰 Deuda Actual</label>
              <input
                type="text"
                value={`$${selectedClient.currentDebt.toFixed(2)}`}
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>💵 Monto a Pagar</label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                max={selectedClient.currentDebt}
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
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>💳 Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'efectivo' | 'transferencia')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white'
                }}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="transferencia">💳 Transferencia</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
              <button
                onClick={handlePayment}
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
                ✅ Confirmar Pago
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
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

export default Credits;
