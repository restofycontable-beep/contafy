import React, { useRef, useState } from "react";
import ArchivosProcesadosTabla from "../../components/procesamiento/ArchivosProcesadosTabla";
import NuevoDocumentoModal from "../../components/procesamiento/NuevoDocumentoModal";
import "../../styles/main-panel.css";

const MainPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const archivosTablaRef = useRef();

  const handleNuevoDocumento = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleProcesamientoSuccess = (result) => {
("Procesamiento exitoso:", result);
    // Refrescar la lista de archivos después del procesamiento exitoso
    if (archivosTablaRef.current && archivosTablaRef.current.cargarArchivos) {
      archivosTablaRef.current.cargarArchivos();
    }
  };

  return (
    <main className="main-panel">
      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-number">0</div>
            <div className="stat-label">Documentos</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-number">$0</div>
            <div className="stat-label">Valor Total</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">0</div>
            <div className="stat-label">Aprobados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">0</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
      </div>

      {/* Tabla de archivos procesados */}
      <ArchivosProcesadosTabla ref={archivosTablaRef} />

      {/* Estado vacío mejorado */}
      <div className="empty-state fade-in">
        <div className="empty-state-icon">📁</div>
        <div className="empty-state-title">Aún no hay documentos disponibles</div>
        <div className="empty-state-description">
          Comienza cargando todos tus documentos en un único lugar para tener un control completo de tu gestión empresarial.
        </div>
        <div className="empty-state-actions">
          <button 
            className="empty-state-btn"
            onClick={handleNuevoDocumento}
          >
            + Nuevo documento
          </button>
          <button className="empty-state-btn-secondary">Importar desde Excel</button>
        </div>
      </div>

      {/* Modal de Nuevo Documento */}
      <NuevoDocumentoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleProcesamientoSuccess}
      />
    </main>
  );
};

export default MainPanel; 