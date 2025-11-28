import React, { useEffect, useState } from 'react';
import '../../styles/archivos-procesados.css';

const ArchivosProcesados = () => {
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/procesamiento/archivos-procesados`)
      .then(res => res.json())
      .then(data => {
        setArchivos(data.archivos || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error cargando archivos:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-message">Cargando archivos...</div>;

  return (
    <div className="archivos-procesados">
      <h2>📁 Archivos Procesados</h2>
      
      <div className="archivos-content">
        {archivos.length === 0 ? (
          <div className="no-archivos">
            No hay archivos procesados aún. Sube un archivo Excel para comenzar.
          </div>
        ) : (
          <table className="archivos-table">
            <thead>
              <tr>
                <th>📄 Nombre del Archivo</th>
                <th>📏 Tamaño</th>
                <th>📅 Fecha de Procesamiento</th>
                <th>📝 Descripción</th>
                <th>⬇️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {archivos.map(archivo => (
                <tr key={archivo.id}>
                  <td>
                    <div className="archivo-info">
                      <span className="archivo-icon">📄</span>
                      {archivo.nombre_archivo}
                    </div>
                  </td>
                  <td>{archivo.tamano_mb} MB</td>
                  <td>{new Date(archivo.fecha_procesamiento).toLocaleString()}</td>
                  <td>Archivo procesado desde Excel</td>
                  <td>
                    <a
                      href={`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/procesamiento/descargar-archivo/${archivo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="download-link"
                    >
                      Descargar
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ArchivosProcesados;