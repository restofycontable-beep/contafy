import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RestofyService from '../../services/restofyService';
import { obtenerCredencialesRestofy } from '../../utils/restofyUtils';
import './RestofyComponents.css';

const ItemsFacturasRestofy = ({ empresaId, empresa }) => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tieneRestofy, setTieneRestofy] = useState(false);
  const [restofyUrl, setRestofyUrl] = useState(null);
  const [restofyToken, setRestofyToken] = useState(null);
  const [fechasInicializadas, setFechasInicializadas] = useState(false);
  const [credencialesCargadas, setCredencialesCargadas] = useState(false);

  // Convertir fecha de formato datetime-local a formato API
  const convertirFechaParaAPI = (fechaLocal, esFechaInicio = false) => {
    if (!fechaLocal) return null;
    
    if (fechaLocal.includes('T')) {
      const [fecha] = fechaLocal.split('T');
      if (esFechaInicio) {
        return `${fecha} 00:00:01`;
      } else {
        return `${fecha} 23:59:59`;
      }
    } else {
      if (esFechaInicio) {
        return `${fechaLocal} 00:00:01`;
      } else {
        return `${fechaLocal} 23:59:59`;
      }
    }
  };

  // Obtener fecha por defecto (último mes)
  const obtenerFechaPorDefecto = (diasAtras = 30) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - diasAtras);
    fecha.setHours(0, 0, 0, 0);
    return fecha.toISOString().slice(0, 16);
  };
  
  // Obtener fecha de fin por defecto (hoy)
  const obtenerFechaFinPorDefecto = () => {
    const fecha = new Date();
    fecha.setHours(23, 59, 0, 0);
    return fecha.toISOString().slice(0, 16);
  };

  // Obtener credenciales de Restofy desde la empresa
  useEffect(() => {
    const cargarCredenciales = async () => {
      if (!empresaId) {
        console.warn('⚠️ ItemsFacturasRestofy: No hay ID de empresa');
        return;
      }

      console.log('🔑 ItemsFacturasRestofy: Cargando credenciales de Restofy', {
        empresaId,
        tieneEmpresa: !!empresa
      });

      const credenciales = await obtenerCredencialesRestofy(empresaId, empresa, token);
      
      if (credenciales.tieneRestofy) {
        console.log('✅ ItemsFacturasRestofy: Credenciales cargadas exitosamente');
        setRestofyUrl(credenciales.restofyUrl);
        setRestofyToken(credenciales.restofyToken);
        setTieneRestofy(true);
        setError(null);
      } else {
        console.warn('⚠️ ItemsFacturasRestofy: No se pudieron obtener credenciales', {
          error: credenciales.error
        });
        setTieneRestofy(false);
        setError(credenciales.error);
      }
      
      setCredencialesCargadas(true);
    };

    cargarCredenciales();
  }, [empresaId, empresa, token]);

  const cargarItems = async () => {
    if (!restofyUrl || !restofyToken || !startDate || !endDate) {
      console.warn('⚠️ ItemsFacturasRestofy: Faltan datos para cargar items', {
        tieneUrl: !!restofyUrl,
        tieneToken: !!restofyToken,
        tieneStartDate: !!startDate,
        tieneEndDate: !!endDate
      });
      return;
    }

    console.log('🛒 ItemsFacturasRestofy: Cargando items', {
      page,
      startDate,
      endDate
    });

    setLoading(true);
    setError(null);

    try {
      const startDateAPI = convertirFechaParaAPI(startDate, true);
      const endDateAPI = convertirFechaParaAPI(endDate, false);

      console.log('📅 ItemsFacturasRestofy: Fechas convertidas', {
        startDateOriginal: startDate,
        startDateAPI,
        endDateOriginal: endDate,
        endDateAPI
      });

      // Llamar directamente a la API de Restofy
      const result = await RestofyService.obtenerItemsFacturas(
        restofyUrl,
        restofyToken,
        page,
        startDateAPI,
        endDateAPI
      );

      if (result.success) {
        const responseData = result.data;
        if (responseData && responseData.status === 1) {
          const itemsObtenidos = responseData.content || [];
          console.log('✅ ItemsFacturasRestofy: Items obtenidos exitosamente', {
            cantidad: itemsObtenidos.length,
            page
          });
          setItems(itemsObtenidos);
          setTieneRestofy(true);
          setError(null);
        } else {
          console.warn('⚠️ ItemsFacturasRestofy: Respuesta con error de la API', {
            status: responseData.status,
            error: responseData.error
          });
          setItems([]);
          setError(responseData.error || 'No se pudieron obtener los items');
        }
      } else {
        console.error('❌ ItemsFacturasRestofy: Error al obtener items', {
          error: result.error,
          status_code: result.status_code
        });
        setItems([]);
        setError(result.error);
        setTieneRestofy(result.tiene_restofy !== undefined ? result.tiene_restofy : true);
      }
    } catch (err) {
      console.error('❌ ItemsFacturasRestofy: Excepción al cargar items', {
        error: err.message,
        stack: err.stack
      });
      setItems([]);
      setError('Error al cargar los items: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Establecer fechas por defecto cuando cambie empresaId y las credenciales estén cargadas
  useEffect(() => {
    if (empresaId && credencialesCargadas) {
      console.log('📅 ItemsFacturasRestofy: Inicializando fechas por defecto');
      const fechaInicio = obtenerFechaPorDefecto(30);
      const fechaFin = obtenerFechaFinPorDefecto();
      setStartDate(fechaInicio);
      setEndDate(fechaFin);
      setPage(1);
      setTimeout(() => {
        setFechasInicializadas(true);
      }, 0);
    } else {
      setFechasInicializadas(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, credencialesCargadas]);

  // Cargar items cuando se inicialicen las fechas por primera vez
  useEffect(() => {
    if (empresaId && restofyUrl && restofyToken && startDate && endDate && fechasInicializadas && tieneRestofy) {
      console.log('🔄 ItemsFacturasRestofy: Cargando items iniciales');
      cargarItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechasInicializadas, tieneRestofy, restofyUrl, restofyToken]);

  // Cargar items cuando cambie page
  useEffect(() => {
    if (empresaId && restofyUrl && restofyToken && startDate && endDate && fechasInicializadas && page > 1 && tieneRestofy) {
      console.log('🔄 ItemsFacturasRestofy: Cambiando página', { page });
      cargarItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleBuscar = () => {
    console.log('🔍 ItemsFacturasRestofy: Buscar items manualmente');
    setPage(1);
    cargarItems();
  };

  const handleLimpiarFiltros = () => {
    console.log('🧹 ItemsFacturasRestofy: Limpiando filtros');
    const fechaInicio = obtenerFechaPorDefecto(30);
    const fechaFin = obtenerFechaFinPorDefecto();
    setStartDate(fechaInicio);
    setEndDate(fechaFin);
    setPage(1);
    setError(null);
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '-';
    try {
      return new Date(fechaString).toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  };

  const formatearMoneda = (valor) => {
    if (!valor) return '$0';
    const num = parseFloat(valor);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

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
        <h3>🛒 Items de Facturas - {empresa?.razon_social || 'Empresa'}</h3>
        <p className="restofy-subtitle">Listado de items de las facturas electrónicas generadas (50 items por página)</p>
      </div>

      <div className="restofy-filters">
        <div className="filter-group">
          <label htmlFor="start-date">Fecha de inicio:</label>
          <input
            type="datetime-local"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="end-date">Fecha de fin:</label>
          <input
            type="datetime-local"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-actions">
          <button onClick={handleBuscar} className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : '🔍 Buscar'}
          </button>
          <button onClick={handleLimpiarFiltros} className="btn btn-secondary">
            Limpiar
          </button>
        </div>
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
          <p>Cargando items...</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && fechasInicializadas && (
        <div className="restofy-empty">
          <span className="empty-icon">📭</span>
          <h4>No se encontraron items</h4>
          <p>No hay items de facturas para el rango de fechas seleccionado.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="restofy-table-container">
            <table className="restofy-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Factura</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id || 'N/A'}</td>
                    <td>
                      <strong>{item.num_factura || item.factura_numero || 'N/A'}</strong>
                    </td>
                    <td>{item.product_name || item.producto_nombre || 'N/A'}</td>
                    <td>{item.quantity || item.cantidad || '0'}</td>
                    <td className="table-price">{formatearMoneda(item.unit_price || item.precio_unitario)}</td>
                    <td className="table-price">{formatearMoneda(item.subtotal || item.total)}</td>
                    <td>{formatearFecha(item.created_at || item.fecha)}</td>
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
              disabled={items.length === 0 || loading}
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

export default ItemsFacturasRestofy;
