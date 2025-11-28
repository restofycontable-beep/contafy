import React, { useEffect, useRef, useState } from 'react';
import ComprobantesCompras from '../../components/empresa/ComprobantesCompras';
import ComprobantesVentas from '../../components/empresa/ComprobantesVentas';
import ConfiguracionRestofy from '../../components/empresa/ConfiguracionRestofy';
import CuentasContables from '../../components/empresa/CuentasContables';
import InformacionBasica from '../../components/empresa/InformacionBasica';
import RepresentanteLegal from '../../components/empresa/RepresentanteLegal';
import Tabs from '../../components/shared/Tabs';
import { useAuth } from '../../contexts/AuthContext';
import ComprobanteService from '../../services/comprobanteService';
import RestofyService from '../../services/restofyService';
import './CrearEmpresa.css';

const CrearEmpresa = ({ empresaId, onViewChange }) => {
  const { getAuthHeaders, fetchWithAuth, token } = useAuth();
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
    vinculada_restofy: false,
    token_restofysas: '',
    url_restofy: '',
    configuracion_comprobantes: {
      factura: { activo: true, codigo: '01' },
      nota_credito: { activo: true, codigo: '91' },
      nota_debito: { activo: true, codigo: '92' }
    },
    configuracion_comprobantes_compras: {
      factura: { activo: true, codigo: '01' },
      nota_credito: { activo: true, codigo: '91' },
      nota_debito: { activo: true, codigo: '92' }
    },
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
  // Estados para importación de archivos Excel
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileMessage, setFileMessage] = useState({ text: '', type: '' });
  const [estadoCuentas, setEstadoCuentas] = useState({ tiene_cuentas: false, total_cuentas: 0 });
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  
  // Preservar activeTab en sessionStorage para que no se pierda
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem('crear-empresa-tab');
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

  // Definir orden de tabs
  const tabsOrder = [
    'informacion',
    'representante',
    'restofy',
    'comprobantes-ventas',
    'comprobantes-compras',
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
        
        // Cargar comprobantes desde la nueva tabla
        const comprobantesVentas = await ComprobanteService.getComprobantes(empresaId, 'venta', token);
        const comprobantesCompras = await ComprobanteService.getComprobantes(empresaId, 'compra', token);
        
        // Convertir comprobantes de la tabla al formato JSON (para compatibilidad con el formulario)
        const configVentas = comprobantesVentas.success && comprobantesVentas.data.length > 0
          ? ComprobanteService.convertToJsonFormat(comprobantesVentas.data)
          : (empresa.configuracion_comprobantes || {
              factura: { activo: true, codigo: '01' },
              nota_credito: { activo: true, codigo: '91' },
              nota_debito: { activo: true, codigo: '92' }
            });
        
        const configCompras = comprobantesCompras.success && comprobantesCompras.data.length > 0
          ? ComprobanteService.convertToJsonFormat(comprobantesCompras.data)
          : (empresa.configuracion_comprobantes_compras || {
              factura: { activo: true, codigo: '01' },
              nota_credito: { activo: true, codigo: '91' },
              nota_debito: { activo: true, codigo: '92' }
            });
        
        setFormData({
          nit: empresa.nit || '',
          razon_social: empresa.razon_social || '',
          nombre_comercial: empresa.nombre_comercial || '',
          representante_nombre: empresa.representante_nombre || '',
          representante_nit: empresa.representante_nit || '',
          direccion: empresa.direccion || '',
          codigo_departamento: empresa.codigo_departamento || '',
          codigo_ciudad: empresa.codigo_ciudad || '',
          vinculada_restofy: empresa.vinculada_restofy || false,
          token_restofysas: empresa.token_restofysas || '',
          url_restofy: empresa.url_restofy || '',
          configuracion_comprobantes: configVentas,
          configuracion_comprobantes_compras: configCompras,
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
    obtenerEstadoCuentas();
  }, []);

  // Plantillas predefinidas por tipo de empresa
  const plantillasEmpresa = {
    comercial: {
      comprobantes: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: true, codigo: '92' }
      },
      comprobantes_compras: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: true, codigo: '92' }
      },
      cuentas: {
        cuenta_1: { codigo: '1105', nombre: 'Caja General', activo: true },
        cuenta_2: { codigo: '1110', nombre: 'Bancos', activo: true },
        cuenta_3: { codigo: '1305', nombre: 'Clientes', activo: true },
        cuenta_4: { codigo: '1435', nombre: 'Mercancías no Fabricadas', activo: true },
        cuenta_5: { codigo: '2365', nombre: 'Retención en la Fuente', activo: true },
        cuenta_6: { codigo: '2408', nombre: 'IVA por Pagar', activo: true },
        cuenta_7: { codigo: '2205', nombre: 'Proveedores', activo: true },
        cuenta_8: { codigo: '4135', nombre: 'Comercio al por Mayor', activo: true },
        cuenta_9: { codigo: '6205', nombre: 'Compra de Mercancías', activo: true },
        cuenta_10: { codigo: '5115', nombre: 'Gastos de Ventas', activo: true }
      }
    },
    servicios: {
      comprobantes: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: false, codigo: '92' }
      },
      comprobantes_compras: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: false, codigo: '92' }
      },
      cuentas: {
        cuenta_1: { codigo: '1105', nombre: 'Caja', activo: true },
        cuenta_2: { codigo: '1110', nombre: 'Bancos', activo: true },
        cuenta_3: { codigo: '1305', nombre: 'Clientes', activo: true },
        cuenta_4: { codigo: '1524', nombre: 'Equipos de Oficina', activo: true },
        cuenta_5: { codigo: '2365', nombre: 'Retención en la Fuente', activo: true },
        cuenta_6: { codigo: '2408', nombre: 'IVA por Pagar', activo: true },
        cuenta_7: { codigo: '2380', nombre: 'Acreedores Varios', activo: true },
        cuenta_8: { codigo: '4220', nombre: 'Servicios Técnicos', activo: true },
        cuenta_9: { codigo: '5105', nombre: 'Gastos de Personal', activo: true },
        cuenta_10: { codigo: '5115', nombre: 'Gastos Generales', activo: true }
      }
    },
    manufacturera: {
      comprobantes: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: true, codigo: '92' }
      },
      comprobantes_compras: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: true, codigo: '92' }
      },
      cuentas: {
        cuenta_1: { codigo: '1105', nombre: 'Caja', activo: true },
        cuenta_2: { codigo: '1110', nombre: 'Bancos', activo: true },
        cuenta_3: { codigo: '1305', nombre: 'Clientes', activo: true },
        cuenta_4: { codigo: '1405', nombre: 'Materias Primas', activo: true },
        cuenta_5: { codigo: '1410', nombre: 'Productos en Proceso', activo: true },
        cuenta_6: { codigo: '1430', nombre: 'Productos Terminados', activo: true },
        cuenta_7: { codigo: '2205', nombre: 'Proveedores', activo: true },
        cuenta_8: { codigo: '4105', nombre: 'Ventas de Productos', activo: true },
        cuenta_9: { codigo: '6105', nombre: 'Costo de Ventas', activo: true },
        cuenta_10: { codigo: '7205', nombre: 'Mano de Obra Directa', activo: true }
      }
    },
    construccion: {
      comprobantes: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: true, codigo: '92' }
      },
      comprobantes_compras: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: true, codigo: '92' }
      },
      cuentas: {
        cuenta_1: { codigo: '1105', nombre: 'Caja', activo: true },
        cuenta_2: { codigo: '1110', nombre: 'Bancos', activo: true },
        cuenta_3: { codigo: '1305', nombre: 'Clientes', activo: true },
        cuenta_4: { codigo: '1355', nombre: 'Anticipos y Avances', activo: true },
        cuenta_5: { codigo: '1405', nombre: 'Materiales', activo: true },
        cuenta_6: { codigo: '1705', nombre: 'Obras en Construcción', activo: true },
        cuenta_7: { codigo: '2205', nombre: 'Proveedores', activo: true },
        cuenta_8: { codigo: '4210', nombre: 'Servicios de Construcción', activo: true },
        cuenta_9: { codigo: '6105', nombre: 'Costo de Construcción', activo: true },
        cuenta_10: { codigo: '5110', nombre: 'Gastos de Obra', activo: true }
      }
    },
    transporte: {
      comprobantes: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: false, codigo: '92' }
      },
      comprobantes_compras: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: false, codigo: '92' }
      },
      cuentas: {
        cuenta_1: { codigo: '1105', nombre: 'Caja', activo: true },
        cuenta_2: { codigo: '1110', nombre: 'Bancos', activo: true },
        cuenta_3: { codigo: '1305', nombre: 'Clientes', activo: true },
        cuenta_4: { codigo: '1540', nombre: 'Flota y Equipo de Transporte', activo: true },
        cuenta_5: { codigo: '2365', nombre: 'Retención en la Fuente', activo: true },
        cuenta_6: { codigo: '2408', nombre: 'IVA por Pagar', activo: true },
        cuenta_7: { codigo: '2205', nombre: 'Proveedores', activo: true },
        cuenta_8: { codigo: '4240', nombre: 'Servicios de Transporte', activo: true },
        cuenta_9: { codigo: '6110', nombre: 'Combustibles', activo: true },
        cuenta_10: { codigo: '5120', nombre: 'Mantenimiento Vehículos', activo: true }
      }
    },
    restaurante: {
      comprobantes: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: false, codigo: '92' }
      },
      comprobantes_compras: {
        factura: { activo: true, codigo: '01' },
        nota_credito: { activo: true, codigo: '91' },
        nota_debito: { activo: false, codigo: '92' }
      },
      cuentas: {
        cuenta_1: { codigo: '1105', nombre: 'Caja', activo: true },
        cuenta_2: { codigo: '1110', nombre: 'Bancos', activo: true },
        cuenta_3: { codigo: '1305', nombre: 'Clientes', activo: true },
        cuenta_4: { codigo: '1430', nombre: 'Inventario de Alimentos', activo: true },
        cuenta_5: { codigo: '1435', nombre: 'Inventario de Bebidas', activo: true },
        cuenta_6: { codigo: '2408', nombre: 'IVA por Pagar', activo: true },
        cuenta_7: { codigo: '2205', nombre: 'Proveedores', activo: true },
        cuenta_8: { codigo: '4175', nombre: 'Ventas de Restaurante', activo: true },
        cuenta_9: { codigo: '6105', nombre: 'Costo de Ventas', activo: true },
        cuenta_10: { codigo: '5115', nombre: 'Gastos Operacionales', activo: true }
      }
    }
  };

  const handleTipoEmpresaChange = (e) => {
    const tipoEmpresa = e.target.value;
    
    if (tipoEmpresa && plantillasEmpresa[tipoEmpresa]) {
      const plantilla = plantillasEmpresa[tipoEmpresa];
      
      setFormData(prev => ({
        ...prev,
        configuracion_comprobantes: plantilla.comprobantes,
        configuracion_comprobantes_compras: plantilla.comprobantes_compras,
        registro_cuentas: plantilla.cuentas
      }));
      
      setMessage({ 
        text: `✅ Plantilla "${tipoEmpresa}" aplicada correctamente. Puedes modificar los valores según tus necesidades.`, 
        type: 'success' 
      });
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar campos anidados de configuración de comprobantes
    if (name.includes('configuracion_comprobantes.')) {
      const parts = name.split('.');
      const comprobante = parts[1];
      const campo = parts[2];
      
      setFormData(prev => ({
        ...prev,
        configuracion_comprobantes: {
          ...prev.configuracion_comprobantes,
          [comprobante]: {
            ...prev.configuracion_comprobantes[comprobante],
            [campo]: type === 'checkbox' ? checked : value
          }
        }
      }));
    // Manejar campos anidados de configuración de comprobantes de compras
    } else if (name.includes('configuracion_comprobantes_compras.')) {
      const parts = name.split('.');
      const comprobante = parts[1];
      const campo = parts[2];
      
      setFormData(prev => ({
        ...prev,
        configuracion_comprobantes_compras: {
          ...prev.configuracion_comprobantes_compras,
          [comprobante]: {
            ...prev.configuracion_comprobantes_compras[comprobante],
            [campo]: type === 'checkbox' ? checked : value
          }
        }
      }));
    // Campos legacy de registro_cuentas_ventas y registro_cuentas_compras eliminados
    } else if (name.includes('registro_cuentas_factura_venta.')) {
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

  // Función para copiar configuración de Factura de Venta a Nota Crédito
  const copiarConfiguracionFacturaANota = () => {
    const cuentasFactura = formData.registro_cuentas_factura_venta || {};
    
    setFormData(prev => ({
      ...prev,
      registro_cuentas_nota_credito: {
        ...cuentasFactura
      }
    }));
    
    setMessage({
      text: '✅ Configuración copiada exitosamente de Factura de Venta a Nota Crédito',
      type: 'success'
    });
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  // Función para copiar configuración de Factura de Compra a Nota Crédito de Compra
  const copiarConfiguracionFacturaCompraANotaCompra = () => {
    const cuentasFacturaCompra = formData.registro_cuentas_factura_compra || {};
    
    setFormData(prev => ({
      ...prev,
      registro_cuentas_nota_credito_compra: {
        ...cuentasFacturaCompra
      }
    }));
    
    setMessage({
      text: '✅ Configuración copiada exitosamente de Factura de Compra a Nota Crédito de Compra',
      type: 'success'
    });
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };


  // Función helper para renderizar secciones específicas de ventas (10 cuentas)
  // Función para obtener el nombre y descripción de cada cuenta según su número
  const obtenerInfoCuenta = (numeroCuenta) => {
    const infoCuentas = {
      1: { nombre: 'BASE GRAVADA', descripcion: 'Valor de productos/servicios gravados con IVA', obligatoria: true, naturalezaDefault: 'credito' },
      2: { nombre: 'BASE NO GRAVADA', descripcion: 'Valor de productos/servicios exentos de IVA', obligatoria: false, naturalezaDefault: 'credito' },
      3: { nombre: 'IVA', descripcion: 'Valor del impuesto (IVA)', obligatoria: false, naturalezaDefault: 'credito' },
      4: { nombre: 'CONTRAPARTIDA', descripcion: 'Clientes, bancos, caja, etc.', obligatoria: true, naturalezaDefault: 'debito' }
    };
    
    return infoCuentas[numeroCuenta] || { 
      nombre: `ADICIONAL ${numeroCuenta - 4}`, 
      descripcion: 'Cuenta adicional personalizada', 
      obligatoria: false,
      naturalezaDefault: 'debito'
    };
  };

  const renderCuentasVentasEspecificas = (tipo, titulo, descripcion) => {
    const fieldName = tipo === 'factura_venta' ? 'registro_cuentas_factura_venta' : 'registro_cuentas_nota_credito';
    const cuentas = formData[fieldName] || {};
    
    // Obtener cuentas activas y contar cuántas hay
    const cuentasActivas = Object.keys(cuentas).filter(key => cuentas[key]?.activo);
    const numeroCuentasActivas = cuentasActivas.length;
    
    // Determinar qué cuentas mostrar (activas + una más disponible, máximo 10)
    const cuentasAMostrar = [];
    for (let i = 1; i <= 10; i++) {
      const cuentaKey = `cuenta_${i}`;
      const cuenta = cuentas[cuentaKey];
      
      // Mostrar si está activa o es la primera vacía disponible
      if (cuenta?.activo || (cuentasAMostrar.length === numeroCuentasActivas && cuentasAMostrar.length < 10)) {
        cuentasAMostrar.push(i);
      }
    }
    
    // Solo mostrar botón en la sección de Nota Crédito para copiar desde Factura de Venta
    const renderBotonCopia = () => {
      if (tipo === 'nota_credito') {
        return (
          <button
            type="button"
            onClick={copiarConfiguracionFacturaANota}
            className="btn btn-copy btn-copy-from-factura"
            disabled={loading}
            title="Copiar configuración desde Factura de Venta"
          >
            📋 Copiar desde Factura Venta
          </button>
        );
      }
      return null;
    };
    
    // Función para agregar una nueva cuenta vacía
    const agregarNuevaCuenta = () => {
      const siguienteCuenta = numeroCuentasActivas + 1;
      if (siguienteCuenta <= 10) {
        const cuentaKey = `cuenta_${siguienteCuenta}`;
        // Activar automáticamente la siguiente cuenta vacía
        handleInputChange({
          target: {
            name: `${fieldName}.${cuentaKey}.activo`,
            type: 'checkbox',
            checked: true
          }
        });
      }
    };
    
    return (
      <div className="form-section ventas-section">
        <div className="section-header">
          <h3>📋 {titulo}</h3>
          {renderBotonCopia()}
        </div>
        <p className="section-description">
          {descripcion}
          <span className="cuentas-counter"> ({numeroCuentasActivas}/10 cuentas configuradas)</span>
        </p>
        <div className="cuentas-grid">
          {cuentasAMostrar.map(num => {
            const cuentaKey = `cuenta_${num}`;
            const infoCuenta = obtenerInfoCuenta(num);
            const cuenta = cuentas[cuentaKey] || { codigo: '', nombre: '', activo: false, naturaleza: infoCuenta.naturalezaDefault };
            
            return (
              <div key={cuentaKey} className={`cuenta-item ${infoCuenta.obligatoria ? 'obligatoria' : 'opcional'}`}>
                <div className="cuenta-header-descriptiva">
                  <div className="cuenta-header-layout">
                    <label className="checkbox-wrapper" htmlFor={`checkbox_${tipo}_${cuentaKey}`}>
                      <input
                        type="checkbox"
                        id={`checkbox_${tipo}_${cuentaKey}`}
                        name={`${fieldName}.${cuentaKey}.activo`}
                        checked={cuenta.activo || false}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="cuenta-info-derecha">
                      <div className="cuenta-titulo-info">
                        <span className="cuenta-numero-label">Cuenta {num}</span>
                        <span className="cuenta-tipo-badge">{infoCuenta.nombre}</span>
                        {infoCuenta.obligatoria && <span className="badge-obligatoria">OBLIGATORIA</span>}
                      </div>
                      <p className="cuenta-ayuda">{infoCuenta.descripcion}</p>
                    </div>
                  </div>
                </div>
                <div className="cuenta-fields">
                  <div className="form-group">
                    <label htmlFor={`codigo_${tipo}_${cuentaKey}`}>Código:</label>
                    <input
                      type="text"
                      id={`codigo_${tipo}_${cuentaKey}`}
                      name={`${fieldName}.${cuentaKey}.codigo`}
                      value={cuenta.codigo || ''}
                      onChange={handleInputChange}
                      placeholder={num === 1 ? "41359501" : num === 2 ? "41359502" : num === 3 ? "24080501" : num === 4 ? "13050501" : "Ej: 11050501"}
                      disabled={loading || !(cuenta.activo || false)}
                      className="codigo-input"
                      maxLength="8"
                      pattern="[0-9]{1,8}"
                      title="Ingrese hasta 8 dígitos numéricos"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`nombre_${tipo}_${cuentaKey}`}>Nombre:</label>
                    <input
                      type="text"
                      id={`nombre_${tipo}_${cuentaKey}`}
                      name={`${fieldName}.${cuentaKey}.nombre`}
                      value={cuenta.nombre || ''}
                      onChange={handleInputChange}
                      placeholder={num === 1 ? "Ingresos Gravados" : num === 2 ? "Ingresos No Gravados" : num === 3 ? "IVA por Pagar" : num === 4 ? "Clientes o Caja" : "Nombre de la cuenta"}
                      disabled={loading || !(cuenta.activo || false)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`naturaleza_${tipo}_${cuentaKey}`}>Naturaleza:</label>
                    <select
                      id={`naturaleza_${tipo}_${cuentaKey}`}
                      name={`${fieldName}.${cuentaKey}.naturaleza`}
                      value={cuenta.naturaleza || infoCuenta.naturalezaDefault}
                      onChange={handleInputChange}
                      disabled={loading || !(cuenta.activo || false)}
                      className="naturaleza-select"
                    >
                      <option value="debito">💰 Débito</option>
                      <option value="credito">💳 Crédito</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Botón para agregar más cuentas */}
        {numeroCuentasActivas < 10 && (
          <button
            type="button"
            onClick={agregarNuevaCuenta}
            className="btn btn-add-cuenta"
            disabled={loading}
          >
            ➕ Agregar otra cuenta ({numeroCuentasActivas}/10)
          </button>
        )}
      </div>
    );
  };

  // Función helper para renderizar secciones específicas de compras (10 cuentas)
  const renderCuentasComprasEspecificas = (tipo, titulo, descripcion) => {
    const fieldName = tipo === 'factura_compra' ? 'registro_cuentas_factura_compra' : 'registro_cuentas_nota_credito_compra';
    const cuentas = formData[fieldName] || {};
    
    // Obtener cuentas activas y contar cuántas hay
    const cuentasActivas = Object.keys(cuentas).filter(key => cuentas[key]?.activo);
    const numeroCuentasActivas = cuentasActivas.length;
    
    // Determinar qué cuentas mostrar (activas + una más disponible, máximo 10)
    const cuentasAMostrar = [];
    for (let i = 1; i <= 10; i++) {
      const cuentaKey = `cuenta_${i}`;
      const cuenta = cuentas[cuentaKey];
      
      // Mostrar si está activa o es la primera vacía disponible
      if (cuenta?.activo || (cuentasAMostrar.length === numeroCuentasActivas && cuentasAMostrar.length < 10)) {
        cuentasAMostrar.push(i);
      }
    }
    
    // Solo mostrar botón en la sección de Nota Crédito de Compra para copiar desde Factura de Compra
    const renderBotonCopia = () => {
      if (tipo === 'nota_credito_compra') {
        return (
          <button
            type="button"
            onClick={copiarConfiguracionFacturaCompraANotaCompra}
            className="btn btn-copy btn-copy-from-factura-compra"
            disabled={loading}
            title="Copiar configuración desde Factura de Compra"
          >
            📋 Copiar desde Factura Compra
          </button>
        );
      }
      return null;
    };
    
    // Función para agregar una nueva cuenta vacía
    const agregarNuevaCuenta = () => {
      const siguienteCuenta = numeroCuentasActivas + 1;
      if (siguienteCuenta <= 10) {
        const cuentaKey = `cuenta_${siguienteCuenta}`;
        // Activar automáticamente la siguiente cuenta vacía
        handleInputChange({
          target: {
            name: `${fieldName}.${cuentaKey}.activo`,
            type: 'checkbox',
            checked: true
          }
        });
      }
    };
    
    return (
      <div className="form-section compras-section">
        <div className="section-header">
          <h3>📋 {titulo}</h3>
          {renderBotonCopia()}
        </div>
        <p className="section-description">
          {descripcion}
          <span className="cuentas-counter"> ({numeroCuentasActivas}/10 cuentas configuradas)</span>
        </p>
        <div className="cuentas-grid">
          {cuentasAMostrar.map(num => {
            const cuentaKey = `cuenta_${num}`;
            const infoCuenta = obtenerInfoCuenta(num);
            const cuenta = cuentas[cuentaKey] || { codigo: '', nombre: '', activo: false, naturaleza: infoCuenta.naturalezaDefault };
            
            return (
              <div key={cuentaKey} className={`cuenta-item ${infoCuenta.obligatoria ? 'obligatoria' : 'opcional'}`}>
                <div className="cuenta-header-descriptiva">
                  <div className="cuenta-header-layout">
                    <label className="checkbox-wrapper" htmlFor={`checkbox_${tipo}_${cuentaKey}`}>
                      <input
                        type="checkbox"
                        id={`checkbox_${tipo}_${cuentaKey}`}
                        name={`${fieldName}.${cuentaKey}.activo`}
                        checked={cuenta.activo || false}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <div className="cuenta-info-derecha">
                      <div className="cuenta-titulo-info">
                        <span className="cuenta-numero-label">Cuenta {num}</span>
                        <span className="cuenta-tipo-badge">{infoCuenta.nombre}</span>
                        {infoCuenta.obligatoria && <span className="badge-obligatoria">OBLIGATORIA</span>}
                      </div>
                      <p className="cuenta-ayuda">{infoCuenta.descripcion}</p>
                    </div>
                  </div>
                </div>
                <div className="cuenta-fields">
                  <div className="form-group">
                    <label htmlFor={`codigo_${tipo}_${cuentaKey}`}>Código:</label>
                    <input
                      type="text"
                      id={`codigo_${tipo}_${cuentaKey}`}
                      name={`${fieldName}.${cuentaKey}.codigo`}
                      value={cuenta.codigo || ''}
                      onChange={handleInputChange}
                      placeholder="22050501"
                      disabled={loading || !(cuenta.activo || false)}
                      className="codigo-input"
                      maxLength="8"
                      pattern="[0-9]{1,8}"
                      title="Ingrese hasta 8 dígitos numéricos"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`nombre_${tipo}_${cuentaKey}`}>Nombre:</label>
                    <input
                      type="text"
                      id={`nombre_${tipo}_${cuentaKey}`}
                      name={`${fieldName}.${cuentaKey}.nombre`}
                      value={cuenta.nombre || ''}
                      onChange={handleInputChange}
                      placeholder="Proveedores Nacionales"
                      disabled={loading || !(cuenta.activo || false)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`naturaleza_${tipo}_${cuentaKey}`}>Naturaleza:</label>
                    <select
                      id={`naturaleza_${tipo}_${cuentaKey}`}
                      name={`${fieldName}.${cuentaKey}.naturaleza`}
                      value={cuenta.naturaleza || 'credito'}
                      onChange={handleInputChange}
                      disabled={loading || !(cuenta.activo || false)}
                      className="naturaleza-select"
                    >
                      <option value="debito">💰 Débito</option>
                      <option value="credito">💳 Crédito</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Botón para agregar más cuentas */}
        {numeroCuentasActivas < 10 && (
          <button
            type="button"
            onClick={agregarNuevaCuenta}
            className="btn btn-add-cuenta"
            disabled={loading}
          >
            ➕ Agregar otra cuenta ({numeroCuentasActivas}/10)
          </button>
        )}
      </div>
    );
  };

  // Función helper eliminada - ya no se usa

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
    
    // Validar que al menos un tipo de comprobante esté activo
    const comprobantesActivos = Object.values(formData.configuracion_comprobantes || {})
      .some(comp => comp?.activo);
    
    if (!comprobantesActivos) {
      errores.push("Debe activar al menos un tipo de comprobante");
    }
    
    // Validar códigos de comprobantes activos
    Object.entries(formData.configuracion_comprobantes || {}).forEach(([tipo, config]) => {
      if (config?.activo && !config?.codigo?.trim()) {
        errores.push(`El código para ${tipo} es requerido`);
      } else if (config?.activo && config?.codigo && !/^\d{1,3}$/.test(config.codigo.trim())) {
        errores.push(`El código para ${tipo} (${config.codigo}) debe ser numérico de 1-3 dígitos`);
      }
    });
    
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
      const mensajeError = `⚠️ Por favor completa o corrige los siguientes campos antes de guardar:\n${erroresValidacion.map(e => `  • ${e}`).join('\n')}`;
      setMessage({ 
        text: mensajeError, 
        type: 'error' 
      });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      console.log('💾 CrearEmpresa: Guardando empresa', {
        isEditing,
        empresaId: isEditing ? empresaId : 'nueva',
        tieneRestofy: !!(formData.url_restofy && formData.token_restofysas)
      });

      // Guardar empresa primero
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
        const empresaGuardadaId = data.data?.id || empresaId;
        console.log('✅ CrearEmpresa: Empresa guardada exitosamente', {
          isEditing,
          empresaId: empresaGuardadaId
        });

        // Guardar comprobantes en la nueva tabla
        try {
          // Guardar comprobantes de ventas
          const tiposVentas = ['factura', 'nota_credito', 'nota_debito'];
          for (const tipo of tiposVentas) {
            const comprobante = formData.configuracion_comprobantes?.[tipo];
            if (comprobante) {
              // Buscar si ya existe
              const comprobantesExistentes = await ComprobanteService.getComprobantes(
                empresaGuardadaId, 
                'venta', 
                token
              );
              const existente = comprobantesExistentes.data?.find(
                c => c.tipo_comprobante === tipo && c.categoria === 'venta'
              );
              
              if (existente) {
                // Actualizar existente
                await ComprobanteService.updateComprobante(
                  existente.id,
                  empresaGuardadaId,
                  {
                    codigo: comprobante.codigo || '',
                    activo: comprobante.activo !== undefined ? comprobante.activo : true
                  },
                  token
                );
              } else {
                // Crear nuevo
                await ComprobanteService.createComprobante(
                  empresaGuardadaId,
                  {
                    tipo_comprobante: tipo,
                    categoria: 'venta',
                    codigo: comprobante.codigo || '',
                    activo: comprobante.activo !== undefined ? comprobante.activo : true
                  },
                  token
                );
              }
            }
          }
          
          // Guardar comprobantes de compras
          const tiposCompras = ['factura', 'nota_credito', 'nota_debito'];
          for (const tipo of tiposCompras) {
            const comprobante = formData.configuracion_comprobantes_compras?.[tipo];
            if (comprobante) {
              // Buscar si ya existe
              const comprobantesExistentes = await ComprobanteService.getComprobantes(
                empresaGuardadaId, 
                'compra', 
                token
              );
              const existente = comprobantesExistentes.data?.find(
                c => c.tipo_comprobante === tipo && c.categoria === 'compra'
              );
              
              if (existente) {
                // Actualizar existente
                await ComprobanteService.updateComprobante(
                  existente.id,
                  empresaGuardadaId,
                  {
                    codigo: comprobante.codigo || '',
                    activo: comprobante.activo !== undefined ? comprobante.activo : true
                  },
                  token
                );
              } else {
                // Crear nuevo
                await ComprobanteService.createComprobante(
                  empresaGuardadaId,
                  {
                    tipo_comprobante: tipo,
                    categoria: 'compra',
                    codigo: comprobante.codigo || '',
                    activo: comprobante.activo !== undefined ? comprobante.activo : true
                  },
                  token
                );
              }
            }
          }
          console.log('✅ CrearEmpresa: Comprobantes guardados en la nueva tabla');
        } catch (comprobanteError) {
          console.error('⚠️ CrearEmpresa: Error guardando comprobantes en la nueva tabla', comprobanteError);
          // No bloquear el guardado si falla la actualización de comprobantes
        }

        // Si hay credenciales de Restofy, verificar opcionalmente (no bloquea el guardado)
        if (formData.url_restofy && formData.token_restofysas) {
          console.log('🔍 CrearEmpresa: Verificando conexión con Restofy (opcional)');
          
          try {
            const verifyResult = await RestofyService.verificarConexion(
              formData.url_restofy,
              formData.token_restofysas
            );
            
            if (verifyResult.success) {
              console.log('✅ CrearEmpresa: Conexión con Restofy verificada exitosamente');
              setMessage({ 
                text: isEditing 
                  ? '✅ Empresa actualizada y conexión con Restofy verificada exitosamente' 
                  : '✅ Empresa creada y conexión con Restofy verificada exitosamente', 
                type: 'success' 
              });
              // Limpiar el mensaje después de 5 segundos
              setTimeout(() => {
                setMessage({ text: '', type: '' });
              }, 5000);
            } else {
              console.warn('⚠️ CrearEmpresa: La conexión con Restofy no se pudo verificar', {
                error: verifyResult.error
              });
              setMessage({ 
                text: isEditing 
                  ? `✅ Empresa actualizada. ⚠️ La conexión con Restofy no se pudo verificar: ${verifyResult.error}` 
                  : `✅ Empresa creada. ⚠️ La conexión con Restofy no se pudo verificar: ${verifyResult.error}`, 
                type: 'warning' 
              });
            }
          } catch (verifyError) {
            console.error('❌ CrearEmpresa: Error verificando conexión con Restofy', {
              error: verifyError.message,
              stack: verifyError.stack
            });
            setMessage({ 
              text: isEditing 
                ? '✅ Empresa actualizada. ⚠️ No se pudo verificar la conexión con Restofy' 
                : '✅ Empresa creada. ⚠️ No se pudo verificar la conexión con Restofy', 
              type: 'warning' 
            });
          }
        } else {
          // No hay credenciales de Restofy, solo mostrar mensaje de éxito
          setMessage({ 
            text: isEditing ? '✅ Empresa actualizada exitosamente' : '✅ Empresa creada exitosamente', 
            type: 'success' 
          });
          // Limpiar el mensaje después de 5 segundos
          setTimeout(() => {
            setMessage({ text: '', type: '' });
          }, 5000);
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
            token_restofysas: '',
            url_restofy: '',
            configuracion_comprobantes: {
              factura: { activo: true, codigo: '01' },
              nota_credito: { activo: true, codigo: '91' },
              nota_debito: { activo: true, codigo: '92' }
            },
            configuracion_comprobantes_compras: {
              factura: { activo: true, codigo: '01' },
              nota_credito: { activo: true, codigo: '91' },
              nota_debito: { activo: true, codigo: '92' }
            },
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
        console.error('❌ CrearEmpresa: Error al guardar empresa', {
          error: data.error || data.detail,
          status: response.status,
          data: data
        });
        
        // Manejar diferentes tipos de errores del servidor
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
        
        setMessage({ 
          text: mensajeError, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('❌ CrearEmpresa: Error de excepción', {
        error: error.message,
        stack: error.stack
      });
      
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
      
      setMessage({ 
        text: mensajeError, 
        type: 'error' 
      });
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
  const obtenerEstadoCuentas = async () => {
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/procesamiento/estado-cuentas-importadas`;
      
      // Agregar empresa_id como parámetro si estamos editando una empresa
      if (empresaId) {
        url += `?empresa_id=${empresaId}`;
      }
      
      const response = await fetchWithAuth(url, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEstadoCuentas(result.data);
        }
      }
    } catch (error) {
      // console.error('Error obteniendo estado de cuentas:', error);
    }
  };

  const descargarPlantillaCuentas = async () => {
    try {
      setFileMessage({ text: 'Generando plantilla Excel...', type: 'info' });
      
      // Determinar el empresa_id: si es edición usar empresaId (prop), si es creación usar 0
      const empresaIdParaDescarga = empresaId || 0;
      
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/api/procesamiento/descargar-plantilla-cuentas?empresa_id=${empresaIdParaDescarga}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error al descargar plantilla');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Nombre del archivo basado en si es plantilla o datos de la empresa
      const empresaNombre = formData.razon_social ? formData.razon_social.replace(/[^a-zA-Z0-9]/g, '_') : 'Nueva_Empresa';
      const tipoArchivo = empresaIdParaDescarga > 0 ? 'Datos' : 'Plantilla';
      a.download = `${tipoArchivo}_Cuentas_${empresaNombre}_${new Date().toISOString().slice(0,10)}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFileMessage({ text: 'Plantilla descargada exitosamente', type: 'success' });
      setTimeout(() => setFileMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      // console.error('Error descargando plantilla:', error);
      setFileMessage({ text: 'Error al descargar plantilla', type: 'error' });
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
    }
  };

  const manejarImportacionArchivo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    
    // Validar que haya una empresa guardada antes de importar
    if (!empresaId) {
      setFileMessage({ 
        text: '⚠️ Debes guardar la empresa primero antes de importar cuentas. Las cuentas deben estar asociadas a una empresa específica.', 
        type: 'error' 
      });
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
      event.target.value = '';
      return;
    }

    // Verificar si ya hay cuentas importadas para esta empresa
    if (estadoCuentas.tiene_cuentas && !mostrarConfirmacion && empresaId) {
      setFileMessage({ 
        text: `⚠️ Ya tienes ${estadoCuentas.total_cuentas} cuentas importadas para esta empresa. ¿Quieres reemplazarlas o actualizarlas?`, 
        type: 'warning' 
      });
      setMostrarConfirmacion(true);
      // Guardar el archivo para procesar después
      event.target.setAttribute('data-pending-file', 'true');
      return;
    }
    
    await procesarArchivoImportacion(file);
    event.target.value = '';
  };

  const procesarArchivoImportacion = async (file) => {
    // Validar que haya una empresa guardada antes de importar
    if (!empresaId) {
      setFileMessage({ 
        text: '⚠️ Debes guardar la empresa primero antes de importar cuentas. Las cuentas deben estar asociadas a una empresa específica.', 
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
      
      // Siempre enviar empresa_id (requerido)
      formData.append('empresa_id', empresaId);

      
      // Usar fetch directo con solo Authorization header para FormData
      const headers = getAuthHeaders();
      delete headers['Content-Type']; // Remover Content-Type para que el browser lo establezca automáticamente

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/procesamiento/importar-archivo-cuentas`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });


      if (!response.ok) {
        const errorText = await response.text();
        // console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al procesar archivo');
      }

      // Mostrar mensaje de éxito simplificado
      setFileMessage({
        text: 'Archivo procesado exitosamente. Las cuentas se han actualizado correctamente.',
        type: 'success'
      });

      // Actualizar estado de cuentas para que la descarga funcione correctamente
      await obtenerEstadoCuentas();
      setMostrarConfirmacion(false);
      
      setTimeout(() => setFileMessage({ text: '', type: '' }), 5000);
    } catch (error) {
      // console.error('Error importando archivo:', error);
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
      <div className="crear-empresa-header">
        <div className="welcome-section">
          <p className="crear-empresa-subtitle">
            {isEditing ? '✏️ Editar Empresa' : '🏢 Crear Nueva Empresa'}. {isEditing ? 'Modifica los datos de la empresa' : 'Registra una nueva empresa en el sistema'}
          </p>
        </div>
      </div>

      <div className="empresa-form-card">
        <div className="form-header" style={{display: 'none'}}>
          <h2>{isEditing ? '✏️ Editar Empresa' : '🏢 Crear Nueva Empresa'}</h2>
          <p>{isEditing ? 'Modifica los datos de la empresa' : 'Registra una nueva empresa en el sistema'}</p>
        </div>

        {message.text && (
          <div ref={messageRef} className={`message ${message.type}`}>
            <span>{message.type === 'success' ? '✅' : message.type === 'warning' ? '⚠️' : '❌'}</span>
            <div className="message-content">{message.text}</div>
          </div>
        )}

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
              { id: 'restofy', label: 'Restofy', icon: '🔌' },
              { id: 'comprobantes-ventas', label: 'Comprobantes Ventas', icon: '📈' },
              { id: 'comprobantes-compras', label: 'Comprobantes Compras', icon: '🛒' },
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

            {activeTab === 'restofy' && (
              <>
                <div className="form-section">
                  <h3>🔌 Integración con Restofy</h3>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '16px' }}>
                      ¿Esta empresa está vinculada con Restofy?
                    </label>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                        <input
                          type="radio"
                          name="vinculada_restofy"
                          value="true"
                          checked={formData.vinculada_restofy === true}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, vinculada_restofy: true }));
                          }}
                          disabled={loading}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>Sí</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px' }}>
                        <input
                          type="radio"
                          name="vinculada_restofy"
                          value="false"
                          checked={formData.vinculada_restofy === false}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, vinculada_restofy: false }));
                          }}
                          disabled={loading}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span>No</span>
                      </label>
                    </div>
                    <small className="field-help">
                      Selecciona "Sí" si la empresa utiliza Restofy. Si seleccionas "No", los campos de configuración de Restofy no se mostrarán.
                    </small>
                  </div>
                </div>
                {formData.vinculada_restofy && (
                  <ConfiguracionRestofy
                    formData={formData}
                    handleInputChange={handleInputChange}
                    loading={loading}
                  />
                )}
              </>
            )}

            {activeTab === 'comprobantes-ventas' && (
              <ComprobantesVentas
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
              />
            )}

            {activeTab === 'comprobantes-compras' && (
              <ComprobantesCompras
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
              />
            )}

            {activeTab === 'cuentas' && (
              <CuentasContables
                formData={formData}
                handleInputChange={handleInputChange}
                loading={loading}
                renderCuentasVentasEspecificas={renderCuentasVentasEspecificas}
                renderCuentasComprasEspecificas={renderCuentasComprasEspecificas}
                estadoCuentas={estadoCuentas}
                empresaId={empresaId}
                descargarPlantillaCuentas={descargarPlantillaCuentas}
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
    </div>
  );
};

export default CrearEmpresa;
