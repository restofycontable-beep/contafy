import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ConfiguracionEmpresa.css';

const ConfiguracionEmpresa = ({ empresaId, onViewChange }) => {
  const { getAuthHeaders, fetchWithAuth } = useAuth();
  
  
  const [empresa, setEmpresa] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Cargar datos de la empresa
  useEffect(() => {
    if (empresaId) {
      cargarDatosEmpresa();
    } else {
    }
  }, [empresaId]);

  // Recargar datos al volver a la vista de configuración
  useEffect(() => {
    if (empresaId) {
      cargarDatosEmpresa();
    }
  }, []); // Solo una vez al montar el componente

  // Detectar si hay datos de compras para debuggear
  useEffect(() => {
    if (empresa) {
      // Datos cargados
    }
  }, [empresa]);

  const cargarDatosEmpresa = async () => {
    setLoadingData(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetchWithAuth(
        `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/${empresaId}`,
        {
          method: 'GET'
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setEmpresa(data.data);
      } else {
        setMessage({ 
          text: data.error || 'Error al cargar datos de la empresa', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error cargando empresa:', error);
      setMessage({ 
        text: 'Error de conexión al cargar empresa', 
        type: 'error' 
      });
    } finally {
      setLoadingData(false);
    }
  };


  // Funciones de edición eliminadas - ConfiguracionEmpresa es solo lectura

  const handleVolver = () => {
    if (onViewChange) {
      onViewChange('mis-empresas');
    }
  };

  // Función para renderizar solo las cuentas configuradas (activas)
  const renderTodasLasCuentas = (cuentasData, tipo, icono) => {
    if (!cuentasData) {
      return (
        <div className="sin-cuentas-mensaje">
          <span>📝 No hay cuentas configuradas aún</span>
        </div>
      );
    }

    // Filtrar solo las cuentas activas y que tengan código y nombre
    const cuentasActivas = Object.entries(cuentasData)
      .filter(([key, cuenta]) => cuenta?.activo && cuenta.codigo && cuenta.nombre)
      .sort((a, b) => {
        // Ordenar por número de cuenta (cuenta_1, cuenta_2, etc.)
        const numA = parseInt(a[0].replace('cuenta_', ''));
        const numB = parseInt(b[0].replace('cuenta_', ''));
        return numA - numB;
      });

    if (cuentasActivas.length === 0) {
      return (
        <div className="sin-cuentas-mensaje">
          <span>📝 No hay cuentas configuradas aún</span>
        </div>
      );
    }

    return cuentasActivas.map(([cuentaKey, cuenta]) => {
      const numeroCuenta = cuentaKey.replace('cuenta_', '');
      return (
        <div key={`${tipo}-${cuentaKey}`} className={`cuenta-card ${tipo} activo`}>
          <div className="cuenta-header">
            <span className="cuenta-numero">{icono} Cuenta {numeroCuenta}</span>
            <span className="status-badge activo">
              ✅ Activa
            </span>
          </div>
          <div className="cuenta-info">
            <div className="cuenta-codigo"><strong>Código:</strong> {cuenta.codigo}</div>
            <div className="cuenta-nombre"><strong>Nombre:</strong> {cuenta.nombre}</div>
            <div className="cuenta-naturaleza">
              <strong>Naturaleza:</strong> 
              <span className={`naturaleza-badge ${cuenta.naturaleza || 'debito'}`}>
                {cuenta.naturaleza === 'credito' ? '💳 Crédito' : '💰 Débito'}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  if (loadingData) {
    return (
      <div className="configuracion-empresa-container">
        <div className="loading-message">
          <span>⏳</span>
          Cargando configuración de la empresa...
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="configuracion-empresa-container">
        <div className="error-message">
          <span>❌</span>
          No se pudo cargar la información de la empresa
        </div>
        <button className="btn btn-secondary" onClick={handleVolver}>
          Volver a Mis Empresas
        </button>
      </div>
    );
  }

  return (
    <div className="configuracion-empresa-container">
      <div className="configuracion-header-banner">
        <div className="welcome-section">
          <p className="configuracion-subtitle">
            ⚙️ Información completa de la empresa y configuración para scripts de procesamiento
          </p>
        </div>
      </div>
      
      <div className="configuracion-content-card">
        <div className="configuracion-header" style={{display: 'none'}}>
          <h2>⚙️ Configuración de Empresa</h2>
          <p>Información completa de la empresa y configuración para scripts de procesamiento</p>
        </div>

      {/* Información General de la Empresa */}
      <div className="config-section">
        <h3>🏢 Información General</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>NIT:</label>
            <span className="info-value">{empresa.nit}</span>
          </div>
          <div className="info-item">
            <label>Razón Social:</label>
            <span className="info-value">{empresa.razon_social}</span>
          </div>
          <div className="info-item">
            <label>Nombre Comercial:</label>
            <span className="info-value">{empresa.nombre_comercial || 'No especificado'}</span>
          </div>
          <div className="info-item">
            <label>Representante Legal:</label>
            <span className="info-value">{empresa.representante_nombre}</span>
          </div>
          <div className="info-item">
            <label>NIT Representante:</label>
            <span className="info-value">{empresa.representante_nit}</span>
          </div>
          <div className="info-item">
            <label>URL Restofy:</label>
            <span className="info-value">{empresa.url_restofy || 'No configurado'}</span>
          </div>
          <div className="info-item">
            <label>Token RestofySAS:</label>
            <span className="info-value">{empresa.token_restofysas ? '✅ Configurado' : 'No configurado'}</span>
          </div>
          <div className="info-item">
            <label>Estado Restofy:</label>
            <span className={`info-value ${empresa.tiene_restofy ? 'status-ok' : 'status-warning'}`}>
              {empresa.tiene_restofy ? '✅ Configurado' : '⚠️ No configurado'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuración de Comprobantes de Ventas */}
      <div className="config-section">
        <h3>📈 Tipos de Comprobantes de Ventas</h3>
        <div className="comprobantes-grid">
          {empresa.configuracion_comprobantes && Object.entries(empresa.configuracion_comprobantes).map(([tipo, config]) => (
            <div key={tipo} className={`comprobante-card ${config?.activo ? 'activo' : 'inactivo'}`}>
            <div className="comprobante-header">
                <span className="comprobante-tipo">
                  {tipo === 'factura' ? 'FACTURA DE VENTA' : 
                   tipo === 'nota_credito' ? 'NOTA CRÉDITO DE VENTA' : 
                   tipo === 'nota_debito' ? 'NOTA DÉBITO DE VENTA' : 
                   tipo.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`status-badge ${config?.activo ? 'activo' : 'inactivo'}`}>
                  {config?.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </div>
              {config?.activo && (
                <div className="comprobante-codigo">
                  <strong>Código:</strong> {config.codigo}
                </div>
              )}
            </div>
          ))}
            </div>
          </div>

      {/* Configuración de Comprobantes de Compras */}
      <div className="config-section">
        <h3>🛒 Tipos de Comprobantes de Compras</h3>
        <div className="comprobantes-grid">
          {empresa.configuracion_comprobantes_compras && Object.entries(empresa.configuracion_comprobantes_compras).map(([tipo, config]) => (
            <div key={`compras-${tipo}`} className={`comprobante-card ${config?.activo ? 'activo' : 'inactivo'}`}>
            <div className="comprobante-header">
                <span className="comprobante-tipo">
                  {tipo === 'factura' ? 'FACTURA DE COMPRA' : 
                   tipo === 'nota_credito' ? 'NOTA CRÉDITO DE COMPRA' : 
                   tipo === 'nota_debito' ? 'NOTA DÉBITO DE COMPRA' : 
                   tipo.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`status-badge ${config?.activo ? 'activo' : 'inactivo'}`}>
                  {config?.activo ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </div>
              {config?.activo && (
                <div className="comprobante-codigo">
                  <strong>Código:</strong> {config.codigo}
                </div>
              )}
            </div>
          ))}
            </div>
          </div>

      {/* Contenedor Principal: Cuentas Contables lado a lado */}
      <div className="cuentas-contables-config-container">
        
        {/* Grupo Principal: Cuentas Contables de Ventas */}
        <div className="config-section grupo-ventas-config">
          <h2 className="grupo-titulo-config">📈 Registro de Cuentas Contables de Ventas</h2>
          <p className="grupo-descripcion-config">
            Configuración de cuentas contables para el procesamiento de documentos de ventas
          </p>
          
          {/* Sub-sección: Factura de Venta */}
          <div className="subseccion-config">
            <h3>💳 Cuentas de Factura de Venta</h3>
            <p className="section-description">Cuentas configuradas para el procesamiento de facturas de venta (hasta 10 cuentas)</p>
            <div className="cuentas-grid">
              {renderTodasLasCuentas(empresa.registro_cuentas_factura_venta, 'factura-venta', '💳')}
            </div>
          </div>

          {/* Sub-sección: Nota Crédito */}
          <div className="subseccion-config">
            <h3>🧾 Cuentas de Nota Crédito</h3>
            <p className="section-description">Cuentas configuradas para el procesamiento de notas crédito (hasta 10 cuentas)</p>
            <div className="cuentas-grid">
              {renderTodasLasCuentas(empresa.registro_cuentas_nota_credito, 'nota-credito', '🧾')}
            </div>
          </div>

        </div>

        {/* Grupo Principal: Cuentas Contables de Compras */}
        <div className="config-section grupo-compras-config">
          <h2 className="grupo-titulo-config">🛒 Registro de Cuentas Contables de Compras</h2>
          <p className="grupo-descripcion-config">
            Configuración de cuentas contables para el procesamiento de documentos de compras
          </p>
          
          {/* Sub-sección: Factura de Compra */}
          <div className="subseccion-config">
            <h3>📄 Cuentas de Factura de Compra</h3>
            <p className="section-description">Cuentas configuradas para el procesamiento de facturas de compra (hasta 10 cuentas)</p>
            <div className="cuentas-grid">
              {renderTodasLasCuentas(empresa.registro_cuentas_factura_compra, 'factura-compra', '📄')}
            </div>
          </div>

          {/* Sub-sección: Nota Crédito de Compra */}
          <div className="subseccion-config">
            <h3>🧾 Cuentas de Nota Crédito de Compra</h3>
            <p className="section-description">Cuentas configuradas para el procesamiento de notas crédito de compra (hasta 10 cuentas)</p>
            <div className="cuentas-grid">
              {renderTodasLasCuentas(empresa.registro_cuentas_nota_credito_compra, 'nota-credito-compra', '🧾')}
            </div>
          </div>
        </div>
        
      </div>


      {/* Mensajes de estado */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Botones de acción */}
      <div className="botones-accion">
        <button
          className="btn btn-primary"
          onClick={() => onViewChange('editar-empresa', empresaId)}
          disabled={!empresa}
        >
          ✏️ Editar Empresa
        </button>
        
        <button
          className="btn btn-secondary"
          onClick={handleVolver}
        >
          ⬅️ Volver a Mis Empresas
        </button>
      </div>
      </div>
    </div>
  );
};

export default ConfiguracionEmpresa;