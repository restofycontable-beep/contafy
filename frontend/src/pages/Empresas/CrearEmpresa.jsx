import React, { useEffect, useRef, useState } from 'react';
import CuentasContables from '../../components/empresa/CuentasContables';
import InformacionBasica from '../../components/empresa/InformacionBasica';
import RepresentanteLegal from '../../components/empresa/RepresentanteLegal';
import TiposComprobantes from '../../components/empresa/TiposComprobantes';
import NotificationModal from '../../components/shared/NotificationModal';
import Tabs from '../../components/shared/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import './CrearEmpresa.css';

const CrearEmpresa = ({ empresaId, onViewChange }) => {
  const { getAuthHeaders, fetchWithAuth } = useAuth();
  const isEditing = !!empresaId;
  
  // Estados para ubicaciones
  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [loadingCiudades, setLoadingCiudades] = useState(false);
  

  

  

  const [formData, setFormData] = useState({
    nit: '',
    razon_social: '',
    nombre_comercial: '',
    representante_nombre: '',
    representante_nit: '',
    direccion: '',
    codigo_departamento: '',
    codigo_ciudad: '',
    // registro_cuentas_ventas y registro_cuentas_compras eliminados - ahora usamos las secciones específicas
    // Nuevas secciones para el grupo de ventas
    registro_cuentas_factura_venta: {
      cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
    },
    registro_cuentas_nota_credito: {
      cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
    },
    // Nuevas secciones para el grupo de compras
    registro_cuentas_factura_compra: {
      cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
    },
    registro_cuentas_nota_credito_compra: {
      cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
      cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const messageRef = useRef(null);
  
  // Estado para el modal de notificaciones
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  // Estados para importación de archivos Excel
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileMessage, setFileMessage] = useState({ text: '', type: '' });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  
  // Preservar activeTab en sessionStorage para que no se pierda
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem('crear-empresa-tab');
      // Migrar nombres antiguos de tabs
      if (saved === 'comprobantes-ventas' || saved === 'comprobantes-compras') {
        return 'tipos-comprobantes';
      }
      return saved || 'informacion';
    } catch {
      return 'informacion';
    }
  });

  // Guardar tab cuando cambia
  useEffect(() => {
    try {
      sessionStorage.setItem('crear-empresa-tab', activeTab);
    } catch (e) {
      // Ignorar errores de sessionStorage
    }
  }, [activeTab]);

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

  // Definir orden de tabs
  const tabsOrder = [
    'informacion',
    'representante',
    'tipos-comprobantes',
    'cuentas'
  ];

  // Función para obtener el siguiente tab
  const getNextTab = () => {
    const currentIndex = tabsOrder.indexOf(activeTab);
    if (currentIndex < tabsOrder.length - 1) {
      return tabsOrder[currentIndex + 1];
    }
    return null;
  };

  // Verificar si estamos en el último tab
  const isLastTab = activeTab === tabsOrder[tabsOrder.length - 1];

  // Función para manejar siguiente o submit
  const handleNextOrSubmit = (e) => {
    e.preventDefault();
    
    if (isLastTab) {
      // Si estamos en el último tab, hacer submit
      handleSubmit(e);
    } else {
      // Si no estamos en el último tab, ir al siguiente
      const nextTab = getNextTab();
      if (nextTab) {
        setActiveTab(nextTab);
        // Scroll suave hacia arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Función para cargar datos de la empresa (reutilizable)
  const cargarDatosEmpresa = async (preservarMensaje = false) => {
    if (!empresaId) return;
    
    setLoadingData(true);
    // Solo limpiar el mensaje si no se debe preservar
    if (!preservarMensaje) {
      setMessage({ text: '', type: '' });
    }

    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/${empresaId}`;
      
      const response = await fetchWithAuth(url, {
        method: 'GET'
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        const empresa = data.data;
        
        // Los comprobantes y cuentas se cargan directamente desde sus componentes
        setFormData({
          nit: empresa.nit || '',
          razon_social: empresa.razon_social || '',
          nombre_comercial: empresa.nombre_comercial || '',
          representante_nombre: empresa.representante_nombre || '',
          representante_nit: empresa.representante_nit || '',
          direccion: empresa.direccion || '',
          codigo_departamento: empresa.codigo_departamento || '',
          codigo_ciudad: empresa.codigo_ciudad || '',
          // Campos legacy eliminados - solo usamos las secciones específicas
          // Nuevas secciones para el grupo de ventas
          registro_cuentas_factura_venta: empresa.registro_cuentas_factura_venta || {
            cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
          },
          registro_cuentas_nota_credito: empresa.registro_cuentas_nota_credito || {
            cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
          },
          registro_cuentas_factura_compra: empresa.registro_cuentas_factura_compra || {
            cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
          },
          registro_cuentas_nota_credito_compra: empresa.registro_cuentas_nota_credito_compra || {
            cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
            cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
          }
        });
      } else {
        setMessage({ 
          text: data.error || 'Error al cargar datos de la empresa', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'Error de conexión al cargar empresa', 
        type: 'error' 
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Cargar datos de la empresa cuando se está editando
  useEffect(() => {
    if (isEditing && empresaId) {
      cargarDatosEmpresa();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, isEditing]);

  // Hacer scroll automático al mensaje cuando aparece
  useEffect(() => {
    if (message.text && messageRef.current) {
      setTimeout(() => {
        messageRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [message.text]);

  // Cargar departamentos al montar el componente
  useEffect(() => {
    const cargarDepartamentos = async () => {
      setLoadingDepartamentos(true);
      try {
        const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/ubicaciones/departamentos`);
        const data = await response.json();
        if (data.success) {
          setDepartamentos(data.data);
        }
      } catch (error) {
        // console.error('Error cargando departamentos:', error);
      } finally {
        setLoadingDepartamentos(false);
      }
    };
    cargarDepartamentos();
  }, [fetchWithAuth]);

  // Cargar ciudades cuando cambia el departamento
  useEffect(() => {
    const cargarCiudades = async () => {
      if (!formData.codigo_departamento) {
        setCiudades([]);
        return;
      }
      
      setLoadingCiudades(true);
      try {
        const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/ubicaciones/ciudades/${formData.codigo_departamento}`);
        const data = await response.json();
        if (data.success) {
          setCiudades(data.data);
        }
      } catch (error) {
        // console.error('Error cargando ciudades:', error);
      } finally {
        setLoadingCiudades(false);
      }
    };
    cargarCiudades();
  }, [formData.codigo_departamento, fetchWithAuth]);

  // Cargar estado de cuentas importadas
  useEffect(() => {
  }, []);



  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Los comprobantes se manejan directamente desde el componente TiposComprobantes
    // Campos legacy de registro_cuentas_ventas y registro_cuentas_compras eliminados
    if (name.includes('registro_cuentas_factura_venta.')) {
      // Manejar campos anidados de registro de cuentas de factura de venta
      const parts = name.split('.');
      const cuenta = parts[1];
      const campo = parts[2];
      
      setFormData(prev => ({
        ...prev,
        registro_cuentas_factura_venta: {
          ...prev.registro_cuentas_factura_venta,
          [cuenta]: {
            ...prev.registro_cuentas_factura_venta[cuenta],
            [campo]: type === 'checkbox' ? checked : value
          }
        }
      }));
    } else if (name.includes('registro_cuentas_nota_credito.')) {
      // Manejar campos anidados de registro de cuentas de nota crédito
      const parts = name.split('.');
      const cuenta = parts[1];
      const campo = parts[2];
      
      setFormData(prev => ({
        ...prev,
        registro_cuentas_nota_credito: {
          ...prev.registro_cuentas_nota_credito,
          [cuenta]: {
            ...prev.registro_cuentas_nota_credito[cuenta],
            [campo]: type === 'checkbox' ? checked : value
          }
        }
      }));
    } else if (name.includes('registro_cuentas_factura_compra.')) {
      // Manejar campos anidados de registro de cuentas de factura de compra
      const parts = name.split('.');
      const cuenta = parts[1];
      const campo = parts[2];
      
      
      setFormData(prev => {
        // Asegurar que la estructura existe
        const cuentasActuales = prev.registro_cuentas_factura_compra || {};
        const cuentaActual = cuentasActuales[cuenta] || { codigo: '', nombre: '', activo: false, naturaleza: 'debito' };
        
        const nuevaData = {
          ...prev,
          registro_cuentas_factura_compra: {
            ...cuentasActuales,
            [cuenta]: {
              ...cuentaActual,
              [campo]: type === 'checkbox' ? checked : value
            }
          }
        };
        
        return nuevaData;
      });
    } else if (name.includes('registro_cuentas_nota_credito_compra.')) {
      // Manejar campos anidados de registro de cuentas de nota crédito de compra
      const parts = name.split('.');
      const cuenta = parts[1];
      const campo = parts[2];
      
      
      setFormData(prev => {
        // Asegurar que la estructura existe
        const cuentasActuales = prev.registro_cuentas_nota_credito_compra || {};
        const cuentaActual = cuentasActuales[cuenta] || { codigo: '', nombre: '', activo: false, naturaleza: 'debito' };
        
        const nuevaData = {
          ...prev,
          registro_cuentas_nota_credito_compra: {
            ...cuentasActuales,
            [cuenta]: {
              ...cuentaActual,
              [campo]: type === 'checkbox' ? checked : value
            }
          }
        };
        
        return nuevaData;
      });
    } else {
      // Manejar campos normales
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };


  // Validación de configuración
  const validarConfiguracion = () => {
    const errores = [];
    
    // Validar NIT de la empresa (puede incluir dígito de verificación con guión)
    if (!formData.nit?.trim()) {
      errores.push("El NIT de la empresa es requerido");
    } else {
      const nitLimpio = formData.nit.trim().replace(/[-\s]/g, ''); // Quitar guiones y espacios
      if (!/^\d{6,12}$/.test(nitLimpio)) {
        errores.push(`El NIT de la empresa (${formData.nit}) debe tener entre 6 y 12 dígitos (puede incluir dígito de verificación con guión)`);
      }
    }
    
    // Validar razón social
    if (!formData.razon_social?.trim()) {
      errores.push("La razón social es requerida");
    }
    
    // Validar representante
    if (!formData.representante_nombre?.trim()) {
      errores.push("El nombre del representante es requerido");
    }
    
    if (!formData.representante_nit?.trim()) {
      errores.push("El NIT del representante es requerido");
    } else {
      const nitRepresentanteLimpio = formData.representante_nit.trim().replace(/[-\s]/g, ''); // Quitar guiones y espacios
      if (!/^\d{6,12}$/.test(nitRepresentanteLimpio)) {
        errores.push(`El NIT del representante (${formData.representante_nit}) debe tener entre 6 y 12 dígitos (puede incluir dígito de verificación con guión)`);
      }
    }
    
    // Los comprobantes se validan directamente desde el componente TiposComprobantes
    // Las cuentas contables son opcionales - el contador las configurará según necesidad
    
    // Validaciones de campos legacy eliminadas - solo validamos las secciones específicas

    // Validar códigos y nombres de cuentas activas de factura de venta
    Object.entries(formData.registro_cuentas_factura_venta || {}).forEach(([cuentaKey, cuenta]) => {
      if (cuenta?.activo) {
        const numeroCuenta = cuentaKey.replace('cuenta_', '');
        if (!cuenta?.codigo?.trim()) {
          errores.push(`💳 Factura de Venta - Cuenta ${numeroCuenta}: El código es requerido (desactiva la cuenta si no la necesitas)`);
        }
        if (!cuenta?.nombre?.trim()) {
          errores.push(`💳 Factura de Venta - Cuenta ${numeroCuenta}: El nombre es requerido (desactiva la cuenta si no la necesitas)`);
        }
        // Validar formato de código contable (debe ser numérico y tener entre 6-10 dígitos)
        if (cuenta?.codigo && !/^\d{6,10}$/.test(cuenta.codigo.trim())) {
          errores.push(`💳 Factura de Venta - Cuenta ${numeroCuenta}: El código (${cuenta.codigo}) debe tener entre 6 y 10 dígitos numéricos`);
        }
      }
    });

    // Validar códigos y nombres de cuentas activas de nota crédito
    Object.entries(formData.registro_cuentas_nota_credito || {}).forEach(([cuentaKey, cuenta]) => {
      if (cuenta?.activo) {
        const numeroCuenta = cuentaKey.replace('cuenta_', '');
        if (!cuenta?.codigo?.trim()) {
          errores.push(`🧾 Nota Crédito de Venta - Cuenta ${numeroCuenta}: El código es requerido (desactiva la cuenta si no la necesitas)`);
        }
        if (!cuenta?.nombre?.trim()) {
          errores.push(`🧾 Nota Crédito de Venta - Cuenta ${numeroCuenta}: El nombre es requerido (desactiva la cuenta si no la necesitas)`);
        }
        // Validar formato de código contable (debe ser numérico y tener entre 6-10 dígitos)
        if (cuenta?.codigo && !/^\d{6,10}$/.test(cuenta.codigo.trim())) {
          errores.push(`🧾 Nota Crédito de Venta - Cuenta ${numeroCuenta}: El código (${cuenta.codigo}) debe tener entre 6 y 10 dígitos numéricos`);
        }
      }
    });

    // Validar códigos y nombres de cuentas activas de factura de compra
    Object.entries(formData.registro_cuentas_factura_compra || {}).forEach(([cuentaKey, cuenta]) => {
      if (cuenta?.activo) {
        const numeroCuenta = cuentaKey.replace('cuenta_', '');
        if (!cuenta?.codigo?.trim()) {
          errores.push(`💳 Factura de Compra - Cuenta ${numeroCuenta}: El código es requerido (desactiva la cuenta si no la necesitas)`);
        }
        if (!cuenta?.nombre?.trim()) {
          errores.push(`💳 Factura de Compra - Cuenta ${numeroCuenta}: El nombre es requerido (desactiva la cuenta si no la necesitas)`);
        }
        // Validar formato de código contable (debe ser numérico y tener entre 6-10 dígitos)
        if (cuenta?.codigo && !/^\d{6,10}$/.test(cuenta.codigo.trim())) {
          errores.push(`💳 Factura de Compra - Cuenta ${numeroCuenta}: El código (${cuenta.codigo}) debe tener entre 6 y 10 dígitos numéricos`);
        }
      }
    });

    // Validar códigos y nombres de cuentas activas de nota crédito de compra
    Object.entries(formData.registro_cuentas_nota_credito_compra || {}).forEach(([cuentaKey, cuenta]) => {
      if (cuenta?.activo) {
        const numeroCuenta = cuentaKey.replace('cuenta_', '');
        if (!cuenta?.codigo?.trim()) {
          errores.push(`🧾 Nota Crédito de Compra - Cuenta ${numeroCuenta}: El código es requerido (desactiva la cuenta si no la necesitas)`);
        }
        if (!cuenta?.nombre?.trim()) {
          errores.push(`🧾 Nota Crédito de Compra - Cuenta ${numeroCuenta}: El nombre es requerido (desactiva la cuenta si no la necesitas)`);
        }
        // Validar formato de código contable (debe ser numérico y tener entre 6-10 dígitos)
        if (cuenta?.codigo && !/^\d{6,10}$/.test(cuenta.codigo.trim())) {
          errores.push(`🧾 Nota Crédito de Compra - Cuenta ${numeroCuenta}: El código (${cuenta.codigo}) debe tener entre 6 y 10 dígitos numéricos`);
        }
      }
    });
    
    return errores;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar configuración antes de enviar
    const erroresValidacion = validarConfiguracion();
    
    if (erroresValidacion.length > 0) {
      const mensajeError = `Por favor completa o corrige los siguientes campos antes de guardar:\n\n${erroresValidacion.map(e => `• ${e}`).join('\n')}`;
      showNotification('warning', mensajeError, 'Campos Requeridos');
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const url = isEditing 
        ? `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/${empresaId}`
        : `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}/api/empresas/`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      let response;
      try {
        response = await fetchWithAuth(url, {
          method: method,
          body: JSON.stringify(formData)
        });
      } catch (fetchError) {
        // Si fetchWithAuth lanza un error, manejarlo aquí
        throw new Error(fetchError.message || 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.');
      }

      // Si es una respuesta de error de red (status 0), manejar directamente
      if (response && !response.ok && response.status === 0) {
        // Es un error de red simulado
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error de conexión con el servidor. Verifica tu conexión a internet.');
      }

      // Intentar parsear la respuesta JSON
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Si no se puede parsear JSON, leer como texto
        const textError = await response.text();
        throw new Error(`Error del servidor (${response.status || 'desconocido'}): ${textError || 'Error desconocido'}`);
      }

      if (response.ok && (data.success || data.data)) {
        // Mostrar notificación de éxito
        showNotification(
          'success',
          isEditing 
            ? 'Los datos de la empresa han sido actualizados correctamente.'
            : 'La empresa ha sido creada exitosamente.\n\nAhora puedes configurar los tipos de comprobantes y agregar cuentas contables.',
          isEditing ? 'Empresa Actualizada' : 'Empresa Creada'
        );
        
        // Si es creación nueva, redirigir a editar la empresa recién creada para poder agregar cuentas
        if (!isEditing && data.data?.id) {
          setTimeout(() => {
            if (onViewChange) {
              onViewChange('editar-empresa', data.data.id);
            }
          }, 3000); // Esperar 3 segundos para que el usuario vea el mensaje
        }
        
        if (!isEditing) {
          // Limpiar formulario solo si es creación
          setFormData({
            nit: '',
            razon_social: '',
            nombre_comercial: '',
            representante_nombre: '',
            representante_nit: '',
            direccion: '',
            codigo_departamento: '',
            codigo_ciudad: '',
            registro_cuentas_factura_venta: {
              cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
            },
            registro_cuentas_nota_credito: {
              cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
            },
            registro_cuentas_factura_compra: {
              cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
            },
            registro_cuentas_nota_credito_compra: {
              cuenta_1: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_2: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_3: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_4: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_5: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_6: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_7: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_8: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_9: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' },
              cuenta_10: { codigo: '', nombre: '', activo: false, naturaleza: 'debito' }
            }
          });
        } else {
          // Si es edición, recargar los datos actualizados y permanecer en la vista
          // Recargar datos después de un breve momento para asegurar que se guardaron
          // Preservar el mensaje de éxito al recargar
          setTimeout(() => {
            cargarDatosEmpresa(true);
          }, 500);
        }
      } else {
        let mensajeError = '';
        
        if (response.status === 422 && data.detail) {
          // Error de validación de Pydantic (422)
          if (Array.isArray(data.detail)) {
            const errores = data.detail.map(err => {
              const campo = err.loc?.join('.') || 'campo';
              const mensaje = err.msg || 'valor inválido';
              // Traducir nombres de campos a español más amigable
              const camposTraducidos = {
                'nit': 'NIT de la empresa',
                'razon_social': 'Razón social',
                'representante_nombre': 'Nombre del representante',
                'representante_nit': 'NIT del representante',
                'direccion': 'Dirección',
                'codigo_departamento': 'Departamento',
                'codigo_ciudad': 'Ciudad'
              };
              const nombreCampo = camposTraducidos[campo] || campo;
              return `  • ${nombreCampo}: ${mensaje}`;
            });
            mensajeError = `⚠️ Por favor corrige los siguientes campos:\n${errores.join('\n')}`;
          } else {
            mensajeError = `⚠️ Error de validación: ${data.detail}`;
          }
        } else if (response.status === 400 && data.error) {
          // Error de negocio (ej: NIT duplicado)
          mensajeError = `⚠️ ${data.error}`;
        } else if (data.detail) {
          // Error con detalle
          mensajeError = `⚠️ ${data.detail}`;
        } else if (data.error) {
          // Error general
          mensajeError = `⚠️ ${data.error}`;
        } else {
          // Error desconocido con mensaje más útil
          mensajeError = isEditing 
            ? '⚠️ Error al actualizar empresa. Por favor verifica que todos los campos requeridos estén completos correctamente.' 
            : '⚠️ Error al registrar empresa. Por favor verifica que todos los campos requeridos estén completos correctamente.';
        }
        
        showNotification('error', mensajeError, 'Error al Procesar');
      }
    } catch (error) {
      let mensajeError = '⚠️ Error al procesar la solicitud. Por favor, intenta nuevamente.';
      
      // Manejar diferentes tipos de errores
      if (error.message) {
        if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          mensajeError = '⚠️ No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.';
        } else if (error.message.includes('timeout') || error.message.includes('Tiempo')) {
          mensajeError = '⚠️ El servidor tardó demasiado en responder. Por favor, intenta nuevamente.';
        } else if (!error.message.includes('Error del servidor')) {
          mensajeError = `⚠️ ${error.message}`;
        } else {
          mensajeError = error.message;
        }
      }
      
      showNotification('error', mensajeError, 'Error de Conexión');
    } finally {
      // CRÍTICO: Siempre desactivar loading, incluso si hay errores
      setLoading(false);
    }
  };

  // Cleanup: asegurar que loading se desactive si el componente se desmonta
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  // Funciones para manejar plantillas Excel

  const manejarImportacionArchivo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!empresaId) {
      setFileMessage({ 
        text: '⚠️ Debes guardar la empresa primero antes de importar cuentas.', 
        type: 'error' 
      });
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
      event.target.value = '';
      return;
    }
    
    await procesarArchivoImportacion(file);
    event.target.value = '';
  };

  const procesarArchivoImportacion = async (file) => {
    if (!empresaId) {
      setFileMessage({ 
        text: '⚠️ Debes guardar la empresa primero antes de importar cuentas.', 
        type: 'error' 
      });
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
      return;
    }

    setUploadingFile(true);
    setFileMessage({ text: 'Procesando archivo...', type: 'info' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('empresa_id', empresaId);

      const headers = getAuthHeaders();
      delete headers['Content-Type'];

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/procesamiento/importar-archivo-cuentas`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al procesar archivo');
      }

      setFileMessage({
        text: 'Archivo procesado exitosamente.',
        type: 'success'
      });

      setMostrarConfirmacion(false);
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      setFileMessage({ text: error.message, type: 'error' });
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
    } finally {
      setUploadingFile(false);
    }
  };

  const confirmarImportacion = async () => {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    if (file) {
      await procesarArchivoImportacion(file);
      fileInput.value = '';
    }
  };

  const cancelarImportacion = () => {
    setMostrarConfirmacion(false);
    setFileMessage({ text: '', type: '' });
    document.getElementById('excelFile').value = '';
  };

  
  return (
    <div className="crear-empresa-container">
      <div className="crear-empresa-header-banner">
        <div className="welcome-section">
          <h1 className="crear-empresa-title">
            {isEditing ? '✏️ Editar Empresa' : '🏢 Crear Nueva Empresa'}
          </h1>
          <p className="crear-empresa-subtitle">
            {isEditing ? 'Modifica los datos de la empresa' : 'Registra una nueva empresa en el sistema'}
          </p>
        </div>
      </div>

      <div className="crear-empresa-content-card">
        <div className="form-header" style={{display: 'none'}}>
          <h2>{isEditing ? '✏️ Editar Empresa' : '🏢 Crear Nueva Empresa'}</h2>
          <p>{isEditing ? 'Modifica los datos de la empresa' : 'Registra una nueva empresa en el sistema'}</p>
        </div>


        {loadingData && (
          <div className="message info">
            <span>⏳</span>
            Cargando datos de la empresa...
          </div>
        )}

        <form 
          onSubmit={(e) => {
            handleSubmit(e);
          }} 
          className="empresa-form"
        >
          <Tabs
            tabs={[
              { id: 'informacion', label: 'Información Básica', icon: '🏢' },
              { id: 'representante', label: 'Representante Legal', icon: '👤' },
              { id: 'tipos-comprobantes', label: 'Tipos de Comprobantes', icon: '📄' },
              { id: 'cuentas', label: 'Cuentas Contables', icon: '💳' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'informacion' && (
              <InformacionBasica
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
                isEditing={isEditing}
                departamentos={departamentos}
                ciudades={ciudades}
                loadingDepartamentos={loadingDepartamentos}
                loadingCiudades={loadingCiudades}
              />
            )}

            {activeTab === 'representante' && (
              <RepresentanteLegal
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
              />
            )}

            {activeTab === 'tipos-comprobantes' && (
              <TiposComprobantes
                empresaId={empresaId}
                loading={loading}
              />
            )}

            {activeTab === 'cuentas' && (
              <CuentasContables
                empresaId={empresaId}
                loading={loading}
                manejarImportacionArchivo={manejarImportacionArchivo}
                uploadingFile={uploadingFile}
                mostrarConfirmacion={mostrarConfirmacion}
                confirmarImportacion={confirmarImportacion}
                cancelarImportacion={cancelarImportacion}
                fileMessage={fileMessage}
              />
            )}
          </Tabs>

          <div className="form-actions">
            {!isLastTab ? (
              // Botón "Siguiente" para tabs que no son el último
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNextOrSubmit}
                disabled={loading}
              >
                Siguiente →
              </button>
            ) : (
              // Botón "Registrar/Actualizar" solo en el último tab
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
                onClick={handleNextOrSubmit}
              >
                {loading 
                  ? (isEditing ? 'Actualizando...' : 'Registrando...') 
                  : (isEditing ? 'Actualizar Empresa' : 'Registrar Empresa')
                }
              </button>
            )}
            
            {/* Botón "Atrás" para todos los tabs excepto el primero */}
            {activeTab !== tabsOrder[0] && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  const currentIndex = tabsOrder.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabsOrder[currentIndex - 1]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                disabled={loading}
              >
                ← Atrás
              </button>
            )}
            
            {isEditing && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => onViewChange('mis-empresas')}
                disabled={loading}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal de notificaciones */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.type === 'success'}
        autoCloseDelay={notification.type === 'success' ? 3000 : 0}
        showCloseButton={true}
      />
    </div>
  );
};

export default CrearEmpresa;
