import React, { useState } from 'react';
import { Vendor } from '../types';

interface VendorLoginProps {
  onLogin: (vendor: Vendor) => void;
}

const vendors: Vendor[] = [
  { id: '1', name: 'Juan Pérez', role: 'Administrador', icon: '👨‍💼' },
  { id: '2', name: 'María García', role: 'Vendedora', icon: '👩‍💼' },
  { id: '3', name: 'Carlos López', role: 'Vendedor', icon: '👨‍💼' }
];

const VendorLogin: React.FC<VendorLoginProps> = ({ onLogin }) => {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleLogin = () => {
    if (selectedVendor) {
      onLogin(selectedVendor);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '10% auto', background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🍦 Sistema POS - Heladería</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', margin: '20px 0' }}>
        {vendors.map(vendor => (
          <div
            key={vendor.id}
            style={{
              padding: '20px',
              border: selectedVendor?.id === vendor.id ? '2px solid #667eea' : '2px solid #e0e0e0',
              borderRadius: '15px',
              textAlign: 'center',
              cursor: 'pointer',
              background: selectedVendor?.id === vendor.id ? 'rgba(102, 126, 234, 0.1)' : 'white',
              transition: 'all 0.2s'
            }}
            onClick={() => handleVendorSelect(vendor)}
          >
            <div style={{ fontSize: '2rem' }}>{vendor.icon}</div>
            <strong>{vendor.name}</strong>
            <div>{vendor.role}</div>
          </div>
        ))}
      </div>
      
      <button
        style={{
          width: '100%',
          padding: '14px 28px',
          border: 'none',
          borderRadius: '12px',
          background: selectedVendor ? 'linear-gradient(45deg, #667eea, #764ba2)' : '#ccc',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: selectedVendor ? 'pointer' : 'not-allowed',
        }}
        onClick={handleLogin}
        disabled={!selectedVendor}
      >
        Iniciar Sesión
      </button>
    </div>
  );
};

export default VendorLogin;
