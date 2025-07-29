import React, { useState, useEffect } from 'react';
import VendorLogin from './components/VendorLogin';
import Dashboard from './components/Dashboard';
import PointOfSale from './components/PointOfSale';
import Inventory from './components/Inventory';
import Credits from './components/Credits';
import Notification from './components/Notification';
import { useNotification } from './hooks/useNotification';
import { Vendor } from './types';
import './App.css';

type ActiveSection = 'dashboard' | 'pos' | 'inventory' | 'credits';

function App() {
  const [currentUser, setCurrentUser] = useState<Vendor | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const { notification, showNotification } = useNotification();

  const handleLogin = (vendor: Vendor) => {
    setCurrentUser(vendor);
    showNotification(`👋 Bienvenido ${vendor.name}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveSection('dashboard');
    showNotification('👋 Sesión cerrada correctamente');
  };

  const renderActiveSection = () => {
    if (!currentUser) return null;

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <PointOfSale currentUser={currentUser} onShowNotification={showNotification} />;
      case 'inventory':
        return <Inventory onShowNotification={showNotification} />;
      case 'credits':
        return <Credits onShowNotification={showNotification} />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return (
      <div className="app">
        <Notification {...notification} />
        <VendorLogin onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="app">
      <Notification {...notification} />
      
      <div className="container">
        <div className="header">
          <div className="logo">🍦 Heladería POS</div>
          <div className="nav-buttons">
            <button 
              className={`nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={`nav-btn ${activeSection === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveSection('pos')}
            >
              🛒 Punto de Venta
            </button>
            <button 
              className={`nav-btn ${activeSection === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveSection('inventory')}
            >
              📦 Inventario
            </button>
            <button 
              className={`nav-btn ${activeSection === 'credits' ? 'active' : ''}`}
              onClick={() => setActiveSection('credits')}
            >
              💳 Créditos
            </button>
          </div>
          <div className="user-info">
            <span className="online-indicator"></span>
            <span>{currentUser.name}</span>
            <button className="btn btn-warning logout-btn" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>

        <div className="main-content">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}

export default App;
