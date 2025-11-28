import React from 'react';

const RepresentanteLegal = ({ formData, handleInputChange, loading }) => {
  return (
    <div className="form-section" style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3>👤 Representante Legal</h3>
      
      <div className="form-group">
        <label htmlFor="representante_nombre">Nombre del Representante Legal *</label>
        <input
          type="text"
          id="representante_nombre"
          name="representante_nombre"
          value={formData.representante_nombre}
          onChange={handleInputChange}
          required
          placeholder="Ej: Juan Pérez"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="representante_nit">NIT del Representante Legal *</label>
        <input
          type="text"
          id="representante_nit"
          name="representante_nit"
          value={formData.representante_nit}
          onChange={handleInputChange}
          required
          placeholder="Ej: 1098311392 o 12345678-9"
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default RepresentanteLegal;

