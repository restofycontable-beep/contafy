import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RestofyService from '../../services/restofyService';
import { obtenerCredencialesRestofy } from '../../utils/restofyUtils';
import './RestofyComponents.css';

const CategoriasRestofy = ({ empresaId, empresa }) => {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [tieneRestofy, setTieneRestofy] = useState(false);
  const [restofyUrl, setRestofyUrl] = useState(null);
  const [restofyToken, setRestofyToken] = useState(null);
  const [credencialesCargadas, setCredencialesCargadas] = useState(false);

  // Obtener credenciales de Restofy desde la empresa
  useEffect(() => {
    const cargarCredenciales = async () => {
      if (!empresaId) {
        console.warn('⚠️ CategoriasRestofy: No hay ID de empresa');
        return;
      }

      console.log('🔑 CategoriasRestofy: Cargando credenciales de Restofy', {
        empresaId,
        tieneEmpresa: !!empresa
      });

      const credenciales = await obtenerCredencialesRestofy(empresaId, empresa, token);
      
      if (credenciales.tieneRestofy) {
        console.log('✅ CategoriasRestofy: Credenciales cargadas exitosamente');
        setRestofyUrl(credenciales.restofyUrl);
        setRestofyToken(credenciales.restofyToken);
        setTieneRestofy(true);
        setError(null);
      } else {
        console.warn('⚠️ CategoriasRestofy: No se pudieron obtener credenciales', {
          error: credenciales.error
        });
        setTieneRestofy(false);
        setError(credenciales.error);
      }
      
      setCredencialesCargadas(true);
    };

    cargarCredenciales();
  }, [empresaId, empresa, token]);

  const cargarCategorias = async () => {
    if (!restofyUrl || !restofyToken) {
      console.warn('⚠️ CategoriasRestofy: Faltan credenciales para cargar categorías', {
        tieneUrl: !!restofyUrl,
        tieneToken: !!restofyToken
      });
      return;
    }

    console.log('📁 CategoriasRestofy: Cargando categorías', { page });

    setLoading(true);
    setError(null);

    try {
      // Llamar directamente a la API de Restofy
      const result = await RestofyService.obtenerCategorias(restofyUrl, restofyToken, page);

      if (result.success) {
        const responseData = result.data;
        if (responseData && responseData.status === 1) {
          const categoriasObtenidas = responseData.content || [];
          console.log('✅ CategoriasRestofy: Categorías obtenidas exitosamente', {
            cantidad: categoriasObtenidas.length,
            page
          });
          setCategorias(categoriasObtenidas);
          setTieneRestofy(true);
          setError(null);
        } else {
          console.warn('⚠️ CategoriasRestofy: Respuesta con error de la API', {
            status: responseData.status,
            error: responseData.error
          });
          setCategorias([]);
          setError(responseData.error || 'No se pudieron obtener las categorías');
        }
      } else {
        console.error('❌ CategoriasRestofy: Error al obtener categorías', {
          error: result.error,
          status_code: result.status_code
        });
        setCategorias([]);
        setError(result.error);
        setTieneRestofy(result.tiene_restofy !== undefined ? result.tiene_restofy : true);
      }
    } catch (err) {
      console.error('❌ CategoriasRestofy: Excepción al cargar categorías', {
        error: err.message,
        stack: err.stack
      });
      setCategorias([]);
      setError('Error al cargar las categorías: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empresaId && credencialesCargadas) {
      console.log('📁 CategoriasRestofy: Inicializando carga de categorías');
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, credencialesCargadas]);

  useEffect(() => {
    if (empresaId && restofyUrl && restofyToken && credencialesCargadas && tieneRestofy && page > 0) {
      console.log('🔄 CategoriasRestofy: Cargando categorías', { page });
      cargarCategorias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, restofyUrl, restofyToken, credencialesCargadas, tieneRestofy]);

  // Mostrar estado de carga de credenciales
  if (!credencialesCargadas) {
    return (
      <div className="restofy-container">
        <div className="restofy-loading">
          <span className="loading-icon">🔄</span>
          <p>Cargando credenciales de Restofy...</p>
        </div>
      </div>
    );
  }

  if (!tieneRestofy) {
    return (
      <div className="restofy-container">
        <div className="restofy-error">
          <div className="error-icon">⚠️</div>
          <h3>Restofy no configurado</h3>
          <p>Esta empresa no tiene integración con Restofy configurada.</p>
          <p>Configure la URL y token de Restofy en la configuración de la empresa.</p>
          {error && (
            <p className="error-detail" style={{ marginTop: '10px', color: '#c33', fontSize: '0.9em' }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="restofy-container">
      <div className="restofy-header">
        <h3>📁 Categorías - {empresa?.razon_social || 'Empresa'}</h3>
        <p className="restofy-subtitle">Listado de categorías de Restofy</p>
      </div>

      {error && (
        <div className="restofy-error-message">
          <span className="error-icon">❌</span>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="restofy-loading">
          <span className="loading-icon">🔄</span>
          <p>Cargando categorías...</p>
        </div>
      )}

      {!loading && !error && categorias.length === 0 && (
        <div className="restofy-empty">
          <span className="empty-icon">📭</span>
          <h4>No se encontraron categorías</h4>
          <p>No hay categorías disponibles en Restofy.</p>
        </div>
      )}

      {!loading && !error && categorias.length > 0 && (
        <>
          <div className="restofy-table-container">
            <table className="restofy-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((categoria) => (
                  <tr key={categoria.id}>
                    <td>{categoria.id || 'N/A'}</td>
                    <td>
                      <strong>{categoria.name || categoria.nombre || 'N/A'}</strong>
                    </td>
                    <td className="table-description">
                      {categoria.description || categoria.descripcion || '-'}
                    </td>
                    <td>
                      {categoria.active !== undefined ? (
                        categoria.active ? (
                          <span className="badge badge-success">Activa</span>
                        ) : (
                          <span className="badge badge-danger">Inactiva</span>
                        )
                      ) : (
                        <span className="badge badge-info">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="restofy-pagination">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || loading}
              className="btn btn-secondary"
            >
              ← Anterior
            </button>
            <span className="pagination-info">Página {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={categorias.length === 0 || loading}
              className="btn btn-secondary"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoriasRestofy;
