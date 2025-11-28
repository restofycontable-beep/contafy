import React, { useState } from "react";
import ProcesamientoService from "../../services/procesamientoService";
import "../../styles/procesamiento-panel.css";

const ProcesamientoPanel = ({ documentos, onProcesarCompleto, empresaSeleccionada }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [nitEmpresa, setNitEmpresa] = useState("901906032");
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleProcesarDocumentosExistente = async () => {
    setLoading(true);
    setError("");
    
    try {
      const resultado = await ProcesamientoService.procesarDocumentosExistente("901906032");
      
      if (resultado.success) {
        setResultado(resultado);
        if (onProcesarCompleto) {
          onProcesarCompleto(resultado);
        }
      } else {
        setError(resultado.error || "Error en el procesamiento");
      }
    } catch (error) {
      setError(error.message || "Error al procesar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleEjecutarScript = async () => {
    if (!selectedFile) {
      setError("Por favor selecciona un archivo Excel");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const resultado = await ProcesamientoService.ejecutarScript(selectedFile, nitEmpresa);
      
      if (resultado.success) {
        setResultado(resultado);
        if (onProcesarCompleto) {
          onProcesarCompleto(resultado);
        }
      } else {
        setError(resultado.error || "Error ejecutando script");
      }
    } catch (error) {
      setError(error.message || "Error al ejecutar script");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarArchivo = (archivo) => {
    // Simular descarga del archivo
    alert(`Descargando archivo: ${archivo.nombre_archivo}`);
  };

  const handleModalSuccess = (result) => {
    setResultado(result);
    if (onProcesarCompleto) {
      onProcesarCompleto(result);
    }
  };

  return (
    <div className="procesamiento-panel">
      <div className="procesamiento-header">
        <h3>🔄 Procesamiento Automático</h3>
        <p>Convierte los documentos de la DIAN a formato contable</p>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="procesamiento-actions">
        <div className="file-upload-section">
          <h4>📁 Procesar Archivo DIAN</h4>
          <p>Sube un archivo DIAN y genera modelos de ventas o compras</p>
          
          {!empresaSeleccionada ? (
            <div className="warning-message">
              ⚠️ Por favor selecciona una empresa antes de procesar archivos
            </div>
          ) : (
            <div className="empresa-info">
              <strong>Empresa seleccionada:</strong> {empresaSeleccionada.razon_social} (NIT: {empresaSeleccionada.nit})
            </div>
          )}
          
          <button
            className="btn-procesamiento"
            onClick={() => setShowModal(true)}
            disabled={!empresaSeleccionada}
          >
            📊 Procesar Archivo DIAN
          </button>
        </div>

        <div className="separator">o</div>

        <button
          className="btn-procesamiento"
          onClick={handleProcesarDocumentosExistente}
          disabled={loading}
        >
          {loading ? "🔄 Procesando..." : "📊 Procesar Documentos"}
        </button>
        
        <div className="procesamiento-info">
          <small>
            • Organiza en archivos de 495 filas<br/>
            • Separa por tipo de documento<br/>
            • Formato compatible con contabilidad<br/>
            • Ejecuta script scripts.py automáticamente
          </small>
        </div>
      </div>

      {resultado && (
        <div className="resultado-procesamiento">
          <div className="resultado-header">
            <h4>✅ Procesamiento Completado</h4>
            <div className="resultado-stats">
              <span>📄 {resultado.total_documentos || resultado.archivos_generados} documentos procesados</span>
              <span>📁 {resultado.archivos_procesados?.length || resultado.archivos_guardados} archivos generados</span>
              {resultado.nit_empresa && <span>🏢 NIT: {resultado.nit_empresa}</span>}
            </div>
          </div>

          {resultado.archivos_procesados && (
            <div className="archivos-generados">
              <h5>Archivos Generados:</h5>
              {resultado.archivos_procesados.map((archivo, index) => (
                <div key={index} className="archivo-item">
                  <div className="archivo-info">
                    <span className="archivo-nombre">{archivo.nombre_archivo}</span>
                    <span className="archivo-filas">{archivo.filas_procesadas} filas</span>
                  </div>
                  <button
                    className="btn-descargar"
                    onClick={() => handleDescargarArchivo(archivo)}
                  >
                    ⬇️ Descargar
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="resultado-detalles">
            <small>
              Procesado el: {new Date(resultado.fecha_procesamiento).toLocaleString()}
            </small>
          </div>
        </div>
      )}

      {/* Modal para procesar archivo DIAN */}
      <NuevoDocumentoModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        empresaSeleccionada={empresaSeleccionada}
      />
    </div>
  );
};

export default ProcesamientoPanel; 