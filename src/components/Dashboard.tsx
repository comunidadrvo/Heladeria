import React, { useState, useEffect } from 'react';
import { getTodaySales, getSales } from '../services/firebase';
import { Sale } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [todayData, recentData] = await Promise.all([
        getTodaySales(),
        getSales(10)
      ]);
      setTodaySales(todayData);
      setRecentSales(recentData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const cashSales = todaySales.filter(sale => sale.paymentMethod === 'efectivo').reduce((sum, sale) => sum + sale.total, 0);
    const transferSales = todaySales.filter(sale => sale.paymentMethod === 'transferencia').reduce((sum, sale) => sum + sale.total, 0);
    const creditSales = todaySales.filter(sale => sale.paymentMethod === 'credito').reduce((sum, sale) => sum + sale.total, 0);

    return { totalSales, cashSales, transferSales, creditSales };
  };

  const stats = calculateStats();

  if (loading) {
    return <div>Cargando dashboard...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '25px' }}>📊 Dashboard - Resumen del Día</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>${stats.totalSales.toFixed(2)}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>💰 Ventas del Día</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>${stats.cashSales.toFixed(2)}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>💵 Ventas Efectivo</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>${stats.transferSales.toFixed(2)}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>💳 Transferencias</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '25px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>${stats.creditSales.toFixed(2)}</div>
          <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: '500' }}>📝 Ventas a Crédito</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '15px' }}>📋 Ventas Recientes</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>⏰ Hora</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>👤 Vendedor</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>🧑‍🤝‍🧑 Cliente</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>🍦 Productos</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>💰 Total</th>
            <th style={{ padding: '15px 12px', textAlign: 'left', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontWeight: 'bold' }}>💳 Pago</th>
          </tr>
        </thead>
        <tbody>
          {recentSales.map(sale => (
            <tr key={sale.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td style={{ padding: '15px 12px' }}>{format(sale.createdAt, 'HH:mm', { locale: es })}</td>
              <td style={{ padding: '15px 12px' }}>{sale.vendorName}</td>
              <td style={{ padding: '15px 12px' }}>{sale.clientName}</td>
              <td style={{ padding: '15px 12px' }}>{sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}</td>
              <td style={{ padding: '15px 12px' }}>${sale.total.toFixed(2)}</td>
              <td style={{ padding: '15px 12px' }}>
                {sale.paymentMethod === 'efectivo' ? '💵 Efectivo' : 
                 sale.paymentMethod === 'transferencia' ? '💳 Transferencia' : 
                 '📝 Crédito'}
              </td>
            </tr>
          ))}
          {recentSales.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No hay ventas recientes
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
