import React, { useEffect, useState } from "react";
import "../../styles/header.css";
import { obtenerFechaActual } from "../../utils/dateUtils";
import { obtenerIniciales } from "../../utils/formatUtils";

const Header = ({ user, onLogout, onMenuToggle, isSidebarOpen, empresaActiva = null }) => {
  const [fechaActual, setFechaActual] = useState(obtenerFechaActual());

  // Actualizar fecha cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setFechaActual(obtenerFechaActual());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const handleHelpClick = () => {
    // TODO: Implementar funcionalidad de ayuda
    alert('Mesa de Ayuda - Funcionalidad próximamente disponible');
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

      {/* Título central - Nombre de empresa si está activa */}
      {empresaActiva && (
        <div className="header-center hide-mobile">
          <h2 className="header-empresa-title">{empresaActiva.razon_social || empresaActiva.nombre_comercial}</h2>
        </div>
      )}
      
      <div className="header-right">
        {/* Fecha actual */}
        <div className="header-date hide-mobile">
          <span className="date-text">{fechaActual}</span>
        </div>

        {/* Iconos de acción */}
        <div className="header-icons hide-mobile">
          <button 
            className="header-icon-btn"
            onClick={handleHelpClick}
            title="Mesa de Ayuda"
            aria-label="Mesa de Ayuda"
          >
            <span className="icon-emoji">👤</span>
          </button>
          <button 
            className="header-icon-btn"
            onClick={() => window.location.href = '/'}
            title="Inicio"
            aria-label="Inicio"
          >
            <span className="icon-emoji">🏠</span>
          </button>
          <button 
            className="header-icon-btn"
            title="Documentos"
            aria-label="Documentos"
          >
            <span className="icon-emoji">📄</span>
          </button>
        </div>

        {/* Información del usuario */}
        <div className="header-user">
          <div className="user-avatar hide-mobile">
            {obtenerIniciales(user?.full_name || user?.username)}
          </div>
          <div className="user-info-header hide-mobile">
            <p className="user-name">{user?.full_name || user?.username}</p>
            <p className="user-email">{user?.email}</p>
          </div>

          {/* Mesa de Ayuda en móvil */}
          <button 
            className="help-btn show-mobile-only"
            onClick={handleHelpClick}
            title="Mesa de Ayuda"
            aria-label="Mesa de Ayuda"
          >
            <span className="help-icon">👤</span>
          </button>

          {/* Botón de cerrar sesión */}
          <div className="header-actions">
            <button 
              className="logout-btn"
              onClick={onLogout}
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <span className="logout-text hide-mobile">Cerrar Sesión</span>
              <span className="logout-icon show-mobile-only">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 