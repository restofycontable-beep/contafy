import React, { useEffect } from 'react';
import './NotificationModal.css';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  title, 
  message, 
  autoClose = true, 
  autoCloseDelay = 3000,
  showCloseButton = true 
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '✅';
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success': return 'Operación Exitosa';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
      default: return 'Notificación';
    }
  };

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div 
        className={`notification-modal ${type}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-header">
          <div className="notification-icon">
            {getIcon()}
          </div>
          <h3 className="notification-title">{getTitle()}</h3>
          {showCloseButton && (
            <button 
              className="notification-close" 
              onClick={onClose}
              aria-label="Cerrar notificación"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
        <div className="notification-body">
          <p className="notification-message">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
