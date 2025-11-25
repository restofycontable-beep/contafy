import React from 'react';

const ComprobantesVentas = ({ formData, handleInputChange, loading }) => {
  return (
    <div className="form-section">
      <h3>📈 Tipos de Comprobantes de Ventas</h3>
      <p className="section-description">
        Configura qué tipos de comprobantes procesar para documentos de ventas y sus códigos específicos
      </p>
      
      <div className="comprobantes-horizontal-container">
        <div className="comprobante-item">
          <div className="comprobante-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="configuracion_comprobantes.factura.activo"
                checked={formData.configuracion_comprobantes?.factura?.activo || false}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              📄 Factura de Venta
            </label>
          </div>
          <div className="comprobante-config">
            <div className="form-group">
              <label htmlFor="codigo_factura">Código:</label>
              <input
                type="text"
                id="codigo_factura"
                name="configuracion_comprobantes.factura.codigo"
                value={formData.configuracion_comprobantes?.factura?.codigo || ''}
                onChange={handleInputChange}
                placeholder="01"
                disabled={loading || !(formData.configuracion_comprobantes?.factura?.activo || false)}
                className="codigo-input"
              />
              <small className="field-help">
                Código para facturas de venta
              </small>
            </div>
          </div>
        </div>

        <div className="comprobante-item">
          <div className="comprobante-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="configuracion_comprobantes.nota_credito.activo"
                checked={formData.configuracion_comprobantes?.nota_credito?.activo || false}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              📋 Nota Crédito de Venta
            </label>
          </div>
          <div className="comprobante-config">
            <div className="form-group">
              <label htmlFor="codigo_nota_credito">Código:</label>
              <input
                type="text"
                id="codigo_nota_credito"
                name="configuracion_comprobantes.nota_credito.codigo"
                value={formData.configuracion_comprobantes?.nota_credito?.codigo || ''}
                onChange={handleInputChange}
                placeholder="91"
                disabled={loading || !(formData.configuracion_comprobantes?.nota_credito?.activo || false)}
                className="codigo-input"
              />
              <small className="field-help">
                Código para notas crédito de venta
              </small>
            </div>
          </div>
        </div>

        <div className="comprobante-item">
          <div className="comprobante-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="configuracion_comprobantes.nota_debito.activo"
                checked={formData.configuracion_comprobantes?.nota_debito?.activo || false}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              📝 Nota Débito de Venta
            </label>
          </div>
          <div className="comprobante-config">
            <div className="form-group">
              <label htmlFor="codigo_nota_debito">Código:</label>
              <input
                type="text"
                id="codigo_nota_debito"
                name="configuracion_comprobantes.nota_debito.codigo"
                value={formData.configuracion_comprobantes?.nota_debito?.codigo || ''}
                onChange={handleInputChange}
                placeholder="92"
                disabled={loading || !(formData.configuracion_comprobantes?.nota_debito?.activo || false)}
                className="codigo-input"
              />
              <small className="field-help">
                Código para notas débito de venta
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprobantesVentas;

