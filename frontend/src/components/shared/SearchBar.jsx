import React from 'react';
import './SearchBar.css';

/**
 * Componente reutilizable de barra de búsqueda
 * @param {string} placeholder - Texto placeholder
 * @param {string} value - Valor del input
 * @param {function} onChange - Función de cambio
 * @param {function} onSearch - Función de búsqueda (opcional)
 * @param {boolean} showButton - Mostrar botón de búsqueda
 */
const SearchBar = ({ 
  placeholder = 'Buscar...', 
  value, 
  onChange, 
  onSearch,
  showButton = false 
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        {showButton && onSearch && (
          <button 
            className="search-button"
            onClick={onSearch}
            aria-label="Buscar"
          >
            Buscar
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

