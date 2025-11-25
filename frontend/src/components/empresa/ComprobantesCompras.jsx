import React from 'react';

const ComprobantesCompras = ({ formData, handleInputChange, loading }) => {
  return (
    <div className="form-section">
      <h3>🛒 Tipos de Comprobantes de Compras</h3>
      <p className="section-description">
        Configura qué tipos de comprobantes procesar para documentos de compras y sus códigos específicos
      </p>
      
      <div className="comprobantes-horizontal-container">
        <div className="comprobante-item">
          <div className="comprobante-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="configuracion_comprobantes_compras.factura.activo"
                checked={formData.configuracion_comprobantes_compras?.factura?.activo || false}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              📄 Factura de Compra
            </label>
          </div>
          <div className="comprobante-config">
            <div className="form-group">
              <label htmlFor="codigo_factura_compra">Código:</label>
              <input
                type="text"
                id="codigo_factura_compra"
                name="configuracion_comprobantes_compras.factura.codigo"
                value={formData.configuracion_comprobantes_compras?.factura?.codigo || ''}
                onChange={handleInputChange}
                placeholder="01"
                disabled={loading || !(formData.configuracion_comprobantes_compras?.factura?.activo || false)}
                className="codigo-input"
              />
              <small className="field-help">
                Código para facturas de compra
              </small>
            </div>
          </div>
        </div>

        <div className="comprobante-item">
          <div className="comprobante-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="configuracion_comprobantes_compras.nota_credito.activo"
                checked={formData.configuracion_comprobantes_compras?.nota_credito?.activo || false}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              📋 Nota Crédito de Compra
            </label>
          </div>
          <div className="comprobante-config">
            <div className="form-group">
              <label htmlFor="codigo_nota_credito_compra">Código:</label>
              <input
                type="text"
                id="codigo_nota_credito_compra"
                name="configuracion_comprobantes_compras.nota_credito.codigo"
                value={formData.configuracion_comprobantes_compras?.nota_credito?.codigo || ''}
                onChange={handleInputChange}
                placeholder="91"
                disabled={loading || !(formData.configuracion_comprobantes_compras?.nota_credito?.activo || false)}
                className="codigo-input"
              />
              <small className="field-help">
                Código para notas crédito de compra
              </small>
            </div>
          </div>
        </div>

        <div className="comprobante-item">
          <div className="comprobante-header">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="configuracion_comprobantes_compras.nota_debito.activo"
                checked={formData.configuracion_comprobantes_compras?.nota_debito?.activo || false}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              📝 Nota Débito de Compra
            </label>
          </div>
          <div className="comprobante-config">
            <div className="form-group">
              <label htmlFor="codigo_nota_debito_compra">Código:</label>
              <input
                type="text"
                id="codigo_nota_debito_compra"
                name="configuracion_comprobantes_compras.nota_debito.codigo"
                value={formData.configuracion_comprobantes_compras?.nota_debito?.codigo || ''}
                onChange={handleInputChange}
                placeholder="92"
                disabled={loading || !(formData.configuracion_comprobantes_compras?.nota_debito?.activo || false)}
                className="codigo-input"
              />
              <small className="field-help">
                Código para notas débito de compra
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprobantesCompras;

