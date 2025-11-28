import React from 'react';

const InformacionBasica = ({ formData, handleInputChange, loading, isEditing, departamentos, ciudades, loadingDepartamentos, loadingCiudades }) => {
  return (
    <div className="form-section" style={{ width: '100%', boxSizing: 'border-box' }}>
      <h3>🏢 Información de la Empresa</h3>
      
      <div className="form-group">
        <label htmlFor="nit">NIT *</label>
        <input
          type="text"
          id="nit"
          name="nit"
          value={formData.nit}
          onChange={handleInputChange}
          required
          placeholder="Ej: 901410420-8 o 1098311392"
          disabled={loading || isEditing}
          className={isEditing ? 'disabled-field' : ''}
        />
        {isEditing && (
          <small className="field-help">
            El NIT no se puede modificar una vez creada la empresa
          </small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="razon_social">Razón Social *</label>
        <input
          type="text"
          id="razon_social"
          name="razon_social"
          value={formData.razon_social}
          onChange={handleInputChange}
          required
          placeholder="Ej: Mi Empresa S.A.S."
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="nombre_comercial">Nombre Comercial</label>
        <input
          type="text"
          id="nombre_comercial"
          name="nombre_comercial"
          value={formData.nombre_comercial}
          onChange={handleInputChange}
          placeholder="Ej: MiEmpresa"
          disabled={loading}
        />
        <small className="field-help">
          Nombre comercial de la empresa (opcional)
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="direccion">Dirección *</label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleInputChange}
          required
          placeholder="Ej: Calle 123 #45-67"
          disabled={loading}
        />
        <small className="field-help">
          Dirección física de la empresa (obligatorio para procesamiento de terceros)
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="codigo_departamento">Departamento *</label>
        <select
          id="codigo_departamento"
          name="codigo_departamento"
          value={formData.codigo_departamento}
          onChange={handleInputChange}
          required
          disabled={loading || loadingDepartamentos}
        >
          <option value="">Seleccione un departamento</option>
          {departamentos.map((dept) => (
            <option key={dept.codigo} value={dept.codigo}>
              {dept.nombre} (Código: {dept.codigo})
            </option>
          ))}
        </select>
        <small className="field-help">
          Seleccione el departamento donde está ubicada la empresa
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="codigo_ciudad">Ciudad *</label>
        <select
          id="codigo_ciudad"
          name="codigo_ciudad"
          value={formData.codigo_ciudad}
          onChange={handleInputChange}
          required
          disabled={loading || loadingCiudades || !formData.codigo_departamento}
        >
          <option value="">
            {!formData.codigo_departamento 
              ? 'Primero seleccione un departamento' 
              : loadingCiudades 
                ? 'Cargando ciudades...' 
                : 'Seleccione una ciudad'}
          </option>
          {ciudades.map((ciudad) => (
            <option key={ciudad.codigo} value={ciudad.codigo}>
              {ciudad.nombre} (Código: {ciudad.codigo})
            </option>
          ))}
        </select>
        <small className="field-help">
          Seleccione la ciudad donde está ubicada la empresa
        </small>
      </div>
    </div>
  );
};

export default InformacionBasica;

