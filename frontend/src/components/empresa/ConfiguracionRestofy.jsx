import React from 'react';

const ConfiguracionRestofy = ({ formData, handleInputChange, loading }) => {
  // Solo mostrar si la empresa está vinculada con Restofy
  if (!formData.vinculada_restofy) {
    return null;
  }

  return (
    <div className="form-section">
      <h3>🔌 Configuración Restofy</h3>
      
      <div className="form-group">
        <label htmlFor="url_restofy">URL de Restofy</label>
        <input
          type="url"
          id="url_restofy"
          name="url_restofy"
          value={formData.url_restofy}
          onChange={handleInputChange}
          placeholder="https://casorellana.develop.app-restofy.com/29/api/restofy"
          disabled={loading}
        />
        <small className="field-help">
          URL completa de la API de Restofy. Ejemplo: https://casorellana.develop.app-restofy.com/29/api/restofy
        </small>
      </div>
      
      <div className="form-group">
        <label htmlFor="token_restofysas">Token RestofySAS</label>
        <input
          type="password"
          id="token_restofysas"
          name="token_restofysas"
          value={formData.token_restofysas}
          onChange={handleInputChange}
          placeholder="Token de autenticación RestofySAS"
          disabled={loading}
        />
        <small className="field-help">
          Token de autenticación para la integración con Restofy. Se probará la conexión al guardar.
        </small>
      </div>
      
      {formData.url_restofy && formData.token_restofysas && (
        <div className="form-group">
          <div className="restofy-test-info">
            <span className="info-icon">ℹ️</span>
            <span>Se probará la conexión con Restofy al guardar la configuración.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracionRestofy;

