import React from "react";
import "../styles/header.css";

const Header = ({ user, onLogout, onMenuToggle, isSidebarOpen }) => {
  const getUserInitials = (user) => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(name => name[0]).join('').toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="header">
      <div className="header-left">
        {/* Botón hamburguesa para móvil */}
        <button 
          className="menu-toggle-btn show-mobile-only"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${isSidebarOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <div className="header-title">
          <img src="/logoContafy.png" alt="Contafy Logo" className="header-logo" />
          <span className="title-text">Contafy</span>
        </div>
      </div>
      
      <div className="header-user">
        <div className="user-avatar hide-mobile">
          {getUserInitials(user)}
        </div>
        <div className="user-info-header hide-mobile">
          <p className="user-name">{user?.full_name || user?.username}</p>
          <p className="user-role">Administrador</p>
        </div>
        <div className="header-actions">
          <button 
            className="logout-btn"
            onClick={onLogout}
          >
            <span className="logout-text hide-mobile">Cerrar Sesión</span>
            <span className="logout-icon show-mobile-only">🚪</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 