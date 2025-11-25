import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/sidebar.css";

const Sidebar = ({ activeView, onViewChange, isOpen }) => {
  const { user } = useAuth();
  const isAdmin = user?.is_superuser || false;
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'crear-empresa', label: 'Crear Empresa', icon: '🏢' },
    { id: 'mis-empresas', label: 'Mis Empresas', icon: '📋' },
    ...(isAdmin ? [{ id: 'admin', label: 'Administración', icon: '👥' }] : []),
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' }
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-title">
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          item.type === 'divider' ? (
            <div key={`divider-${index}`} className="sidebar-divider"></div>
          ) : (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  onViewChange(item.id);
                }
              }}
              disabled={item.disabled}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.disabled && <small>prox</small>}
            </button>
          )
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="connection-status">
          <div className="status-item">
            <span className="status-dot connected"></span>
            <span>API Conectada</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;