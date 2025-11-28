import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CuentaGlobalService from '../../services/cuentaGlobalService';
import NotificationModal from '../shared/NotificationModal';

const CuentasContables = ({ 
  empresaId, 
  loading: parentLoading,
  manejarImportacionArchivo,
  uploadingFile,
  mostrarConfirmacion,
  confirmarImportacion,
  cancelarImportacion,
  fileMessage
}) => {
  const { token } = useAuth();
  const [tiposCuentas, setTiposCuentas] = useState([]);
  const [cuentasConfiguradas, setCuentasConfiguradas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Estado para el modal de notificaciones
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Función para mostrar notificación modal
  const showNotification = (type, message, title = null) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message
    });
  };

  // Función para cerrar notificación
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const cargarTiposCuentas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await CuentaGlobalService.getTiposCuentasGlobales(token);
      if (response.success) {
        setTiposCuentas(response.data);
      } else {
        showNotification('error', response.error || 'Error al cargar tipos de cuentas globales', 'Error de Carga');
      }
    } catch (error) {
      showNotification('error', 'Error de conexión al cargar tipos de cuentas globales', 'Error de Conexión');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const cargarCuentasConfiguradas = useCallback(async () => {
    if (!empresaId || !token) return;
    try {
      const response = await CuentaGlobalService.getCuentasGlobales(empresaId, token);
      if (response.success) {
        setCuentasConfiguradas(response.data || []);
      } else {
        console.error('Error cargando cuentas:', response.error);
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error);
    }
  }, [empresaId, token]);

  useEffect(() => {
    cargarTiposCuentas();
    if (empresaId && token) {
      cargarCuentasConfiguradas();
    }
  }, [empresaId, token, cargarTiposCuentas, cargarCuentasConfiguradas]);

  const handleTipoChange = (tipoId) => {
    setTipoSeleccionado(tipoId);
  };

  const resetForm = () => {
    setTipoSeleccionado('');
    setCodigo('');
    setNombre('');
    setMostrarFormulario(false);
    setMessage({ text: '', type: '' });
  };

  const handleGuardar = async () => {
    if (!tipoSeleccionado || !codigo || !empresaId) {
      showNotification('warning', 'Por favor, complete todos los campos obligatorios antes de guardar.', 'Campos Requeridos');
      return;
    }
    
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await CuentaGlobalService.saveCuentaGlobal(empresaId, {
        tipo_cuenta_id: parseInt(tipoSeleccionado),
        codigo,
        nombre
      }, token);
      
      if (response.success) {
        showNotification('success', 'La cuenta contable ha sido guardada exitosamente.', 'Cuenta Guardada');
        await cargarCuentasConfiguradas();
        resetForm();
      } else {
        showNotification('error', response.error || 'Error al guardar la cuenta contable', 'Error al Guardar');
      }
    } catch (error) {
      showNotification('error', 'Error de conexión al guardar la cuenta contable', 'Error de Conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (cuentaId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cuenta?')) return;
    
    try {
      const response = await CuentaGlobalService.deleteCuentaGlobal(cuentaId, empresaId, token);
      if (response.success) {
        showNotification('success', 'La cuenta contable ha sido eliminada exitosamente.', 'Cuenta Eliminada');
        await cargarCuentasConfiguradas();
      } else {
        showNotification('error', response.error || 'Error al eliminar la cuenta contable', 'Error al Eliminar');
      }
    } catch (error) {
      showNotification('error', 'Error de conexión al eliminar la cuenta contable', 'Error de Conexión');
    }
  };

  const obtenerNombreTipo = (tipoId) => {
    const tipo = tiposCuentas.find(t => t.id === tipoId);
    return tipo ? tipo.nombre : 'Tipo desconocido';
  };

  const isDisabled = loading || parentLoading || saving;
  const canSave = tipoSeleccionado && codigo && !isDisabled;
  const isCreatingNew = !empresaId;

  return (
    <div className="cuentas-contables-container" style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="form-section">
        <h3>💳 Cuentas Contables</h3>
        
        {message.text && (
          <div className={`cuenta-message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        {isCreatingNew && (
          <div className="cuenta-message info">
            ℹ️ Para agregar cuentas contables, primero debes guardar la información básica de la empresa haciendo click en "Registrar Empresa".
          </div>
        )}
        
        {cuentasConfiguradas.length > 0 && (
          <div className="cuentas-configuradas">
            <h4>Cuentas Configuradas</h4>
            <div className="cuentas-list">
              {cuentasConfiguradas.map(cuenta => (
                <div key={cuenta.id} className="cuenta-item-config">
                  <span className="cuenta-tipo">{obtenerNombreTipo(cuenta.tipo_cuenta_id)}</span>
                  <span className="cuenta-codigo">{cuenta.codigo}</span>
                  {cuenta.nombre && <span className="cuenta-nombre">{cuenta.nombre}</span>}
                  <button
                    type="button"
                    className="btn-eliminar-cuenta"
                    onClick={() => handleEliminar(cuenta.id)}
                    disabled={isDisabled}
                    title="Eliminar cuenta"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mostrarFormulario && (
          <div className="configuracion-cuenta-form">
            <div className="form-group">
              <label htmlFor="tipo_cuenta">Tipo de Cuenta *</label>
              <select
                id="tipo_cuenta"
                value={tipoSeleccionado}
                onChange={(e) => handleTipoChange(e.target.value)}
                disabled={isDisabled}
              >
                <option value="">Seleccione un tipo de cuenta</option>
                {tiposCuentas.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {tipoSeleccionado && (
              <>
                <div className="form-group">
                  <label htmlFor="codigo_cuenta">Código *</label>
                  <input
                    type="text"
                    id="codigo_cuenta"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej: 41359501"
                    disabled={isDisabled}
                    maxLength="20"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nombre_cuenta">Nombre</label>
                  <input
                    type="text"
                    id="nombre_cuenta"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Ingresos Gravados"
                    disabled={isDisabled}
                  />
                </div>

                <div className="form-actions-buttons">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGuardar}
                    disabled={!canSave}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="excel-import-section">
          <h4>📊 Importar Cuentas desde Excel</h4>
          
          <div className="file-upload-container">
            <input
              type="file"
              id="excelFile"
              accept=".xlsx,.xls"
              onChange={manejarImportacionArchivo}
              disabled={uploadingFile || isDisabled}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="excelFile" 
              className={`btn btn-primary file-upload-label ${uploadingFile || isDisabled ? 'disabled' : ''}`}
            >
              {uploadingFile ? '⏳ Procesando...' : '📤 Importar Archivo Excel'}
            </label>
          </div>

          {mostrarConfirmacion && (
            <div className="confirmacion-importacion">
              <div className="confirmacion-mensaje">
                <p>⚠️ Ya tienes cuentas importadas.</p>
                <p>¿Qué deseas hacer con el nuevo archivo?</p>
              </div>
              <div className="confirmacion-botones">
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmarImportacion}
                  disabled={uploadingFile}
                >
                  ✅ Continuar
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

          {fileMessage?.text && (
            <div className={`file-message ${fileMessage.type}`}>
              {fileMessage.text}
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-agregar-cuenta-full"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          disabled={isDisabled || isCreatingNew}
          title={isCreatingNew ? 'Primero debes crear la empresa' : ''}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Agregar Nueva Cuenta'}
        </button>

        {/* Modal de notificaciones */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          autoClose={notification.type === 'success'}
          autoCloseDelay={notification.type === 'success' ? 2500 : 0}
          showCloseButton={true}
        />
      </div>
    </div>
  );
};

export default CuentasContables;
