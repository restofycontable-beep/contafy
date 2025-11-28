import React from 'react';
import './SectionBanner.css';

/**
 * Componente reutilizable para banners de sección
 * @param {string} title - Título del banner
 * @param {string} subtitle - Subtítulo opcional
 * @param {React.ReactNode} children - Contenido adicional opcional
 * @param {string} icon - Icono opcional
 */
const SectionBanner = ({ title, subtitle, children, icon }) => {
  return (
    <div className="section-banner">
      <div className="section-banner-content">
        {icon && <span className="section-banner-icon">{icon}</span>}
        <div className="section-banner-text">
          <h1 className="section-banner-title">{title}</h1>
          {subtitle && <p className="section-banner-subtitle">{subtitle}</p>}
        </div>
        {children && <div className="section-banner-actions">{children}</div>}
      </div>
    </div>
  );
};

export default SectionBanner;

