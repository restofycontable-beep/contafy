import React from 'react';

const CuentasContables = ({ 
  formData, 
  handleInputChange, 
  loading, 
  renderCuentasVentasEspecificas, 
  renderCuentasComprasEspecificas,
  estadoCuentas,
  empresaId,
  descargarPlantillaCuentas,
  manejarImportacionArchivo,
  uploadingFile,
  mostrarConfirmacion,
  confirmarImportacion,
  cancelarImportacion,
  fileMessage
}) => {
  return (
    <div className="cuentas-contables-container">
      {/* Grupo Principal: Registro de Cuentas Contables de Ventas */}
      <div className="form-section grupo-ventas">
        <h2 className="grupo-titulo">📈 Registro de Cuentas Contables de Ventas</h2>
        <p className="grupo-descripcion">
          Configure las cuentas contables específicas para el procesamiento de documentos de ventas. 
          La sección de Nota Crédito incluye un botón para copiar la configuración desde Factura de Venta y después editarla según necesite.
        </p>
        
        {/* Sub-sección: Factura de Venta */}
        {renderCuentasVentasEspecificas(
          'factura_venta',
          '💳 Factura de Venta',
          'Cuentas contables para el procesamiento de facturas de venta (hasta 10 cuentas).'
        )}

        {/* Sub-sección: Nota Crédito */}
        {renderCuentasVentasEspecificas(
          'nota_credito',
          '🧾 Nota Crédito',
          'Cuentas contables para el procesamiento de notas crédito (hasta 10 cuentas).'
        )}
      </div>

      {/* Grupo Principal: Registro de Cuentas Contables de Compras */}
      <div className="form-section grupo-compras">
        <h2 className="grupo-titulo">🛒 Registro de Cuentas Contables de Compras</h2>
        <p className="grupo-descripcion">
          Configure las cuentas contables específicas para el procesamiento de documentos de compras. 
          La sección de Nota Crédito de Compra incluye un botón para copiar la configuración desde Factura de Compra y después editarla según necesite.
        </p>
        
        {/* Sub-sección: Factura de Compra */}
        {renderCuentasComprasEspecificas(
          'factura_compra',
          '📄 Factura de Compra',
          'Cuentas contables para el procesamiento de facturas de compra (hasta 10 cuentas).'
        )}

        {/* Sub-sección: Nota Crédito de Compra */}
        {renderCuentasComprasEspecificas(
          'nota_credito_compra',
          '🧾 Nota Crédito de Compra',
          'Cuentas contables para el procesamiento de notas crédito de compra (hasta 10 cuentas).'
        )}

        {/* Sección de Importación de Archivos Excel - AL FINAL */}
        <div className="excel-import-section">
          <h4>📊 Importar Cuentas desde Excel</h4>
          <p className="import-description">
            {empresaId 
              ? "Descarga las cuentas actuales de esta empresa o importa un archivo Excel con datos actualizados (NIT, NOMBRE, CUENTA, CUENTA_IVA)."
              : "Descarga la plantilla Excel, completa los datos (NIT, NOMBRE, CUENTA, CUENTA_IVA) e impórtala para cargar múltiples cuentas a la vez."
            }
          </p>

          <div className="import-buttons">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={descargarPlantillaCuentas}
              disabled={loading}
            >
              📥 {estadoCuentas.tiene_cuentas ? 'Descargar Datos Actuales' : (empresaId ? 'Descargar Plantilla Excel' : 'Descargar Plantilla Excel')}
            </button>
            
            <div className="file-upload-container">
              <input
                type="file"
                id="excelFile"
                accept=".xlsx,.xls"
                onChange={manejarImportacionArchivo}
                disabled={uploadingFile || loading}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="excelFile" 
                className={`btn btn-primary file-upload-label ${uploadingFile || loading ? 'disabled' : ''}`}
              >
                {uploadingFile ? '⏳ Procesando...' : '📤 Importar Archivo Excel'}
              </label>
            </div>
          </div>

          {/* Botones de confirmación cuando hay conflicto */}
          {mostrarConfirmacion && (
            <div className="confirmacion-importacion">
              <div className="confirmacion-mensaje">
                <p>⚠️ Ya tienes {estadoCuentas.total_cuentas} cuentas importadas.</p>
                <p>¿Qué deseas hacer con el nuevo archivo?</p>
              </div>
              <div className="confirmacion-botones">
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmarImportacion}
                  disabled={uploadingFile}
                >
                  ✅ Continuar (Actualizar/Agregar)
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelarImportacion}
                  disabled={uploadingFile}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {fileMessage.text && (
            <div className={`file-message ${fileMessage.type}`}>
              {fileMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CuentasContables;

