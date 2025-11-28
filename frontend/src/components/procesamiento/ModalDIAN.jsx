import React, { useState } from "react";
import DianService from "../../services/dianService";
import "../../styles/procesamiento.css";
import ProcesamientoPanel from "./ProcesamientoPanel";
import ResultadosTabla from "./ResultadosTabla";

const tiposDocumentoCompletos = [
  { value: "CRT", label: "Certificado Registraduría sin identificación" },
  { value: "RC", label: "Registro civil" },
  { value: "TI", label: "Tarjeta de identidad" },
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "TE", label: "Tarjeta de extranjería" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "NIT", label: "NIT" },
  { value: "PA", label: "Pasaporte" },
  { value: "TIPO_DESCONOCIDO", label: "Tipo de documento desconocido" },
  { value: "DOC_EXTRANJERO", label: "Documento de identificación extranjero" },
  { value: "OTRO_PAIS", label: "Nit de otro país" },
  { value: "NIUP", label: "NIUP" },
  { value: "PEP", label: "PEP" },
  { value: "PPT", label: "PPT" }
];

// Usar los mismos tipos para todos (jurídica, natural y certificado)
const tiposDocumentoJuridica = tiposDocumentoCompletos;
const tiposDocumentoNatural = tiposDocumentoCompletos;

const TITULOS = [
  "Recepción",
  "Emisión",
  "N° Documento",
  "Tipo",
  "Emisor",
  "Receptor",
  "Estado",
  "Monto Total"
];

const ModalDIAN = ({ open, onClose }) => {
  const [screen, setScreen] = useState("modal"); // 'modal' o 'certificado'
  const [form, setForm] = useState({
    tipoDoc: "",
    docRep: "",
    nitEmpresa: "",
    token: "",
    fecha: "",
    nit: "",
    password: "",
    file: null,
    desde: "",
    hasta: ""
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [documentos, setDocumentos] = useState([]);
  // Estado para el mensaje de procesamiento (comentado por no uso actual)
  // const [mensaje, setMensaje] = useState("");

  const [tokenUrl, setTokenUrl] = useState("");
  const [mensajeToken, setMensajeToken] = useState("");
  const [loadingToken, setLoadingToken] = useState(false);
  const [tipoConsulta, setTipoConsulta] = useState("enviados"); // "enviados" o "recibidos"
  const [resultados, setResultados] = useState([]);
  const [paginaAbierta, setPaginaAbierta] = useState(false); // Control para evitar abrir múltiples veces
  const [abriendoPagina, setAbriendoPagina] = useState(false); // Control adicional para evitar múltiples clicks

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
    setError(""); // Limpiar error al cambiar campos
  };

  const handleSubmitCertificado = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Primero usar el nuevo flujo de procesamiento de certificado
      const resultado = await DianService.procesarCertificado();
      
      if (resultado.success) {
        // Si el procesamiento automático funciona, usar esos datos
        setDocumentos(resultado.documentos || []);
        setShowResults(true);
      } else {
        // Si falla el automático, usar el método tradicional con certificado subido
        const formData = DianService.prepararFormDataCertificado(form);
        const resultadoTradicional = await DianService.consultarConCertificado(formData);
        
        if (resultadoTradicional.success) {
          setDocumentos(resultadoTradicional.documentos);
          setShowResults(true);
        } else {
          setError(resultadoTradicional.error || "Error en la consulta");
        }
      }
    } catch (error) {
      setError(error.message || "Error al conectar con la DIAN");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Preparar FormData
      const formData = DianService.prepararFormDataToken(form);
      
      // Llamar al servicio
      const resultado = await DianService.consultarConToken(formData);
      
      if (resultado.success) {
        setDocumentos(resultado.documentos);
        setShowResults(true);
      } else {
        setError(resultado.error || "Error en la consulta");
      }
    } catch (error) {
      setError(error.message || "Error al conectar con la DIAN");
    } finally {
      setLoading(false);
    }
  };

  const isValidCertificado = form.nit && form.password && form.file && form.desde && form.hasta;
  // const isValidToken = form.tipoDoc && form.docRep && form.nitEmpresa && form.token && form.fecha;

  // Funciones auxiliares para carga rápida de datos
  const cargarDocumentosExistentes = async (tipo) => {
    try {
(`📊 Cargando documentos existentes de tipo: ${tipo}`);
      const resultado = await DianService.obtenerDocumentosRecientes(tipo, 100);
      
("📋 Datos recibidos del backend:", resultado);
      
      if (resultado.success && resultado.documentos) {
        // Mapear los campos de la base de datos a los campos esperados por la tabla
        const documentosMapeados = resultado.documentos.map(doc => ({
          fecha_recepcion: doc.fecha_recepcion,
          fecha_emision: doc.fecha_emision,
          prefijo: doc.numero_documento?.split('-')[0] || '-',
          numero_documento: doc.numero_documento,
          tipo_documento: doc.tipo_documento,
          nit_emisor: doc.emisor?.split(' - ')[0] || '-',
          emisor: doc.emisor,
          nit_receptor: doc.receptor?.split(' - ')[0] || '-',
          receptor: doc.receptor,
          resultado: doc.estado,
          estado: doc.estado,
          valor_total: doc.monto_total
        }));
        
("📋 Documentos mapeados:", documentosMapeados);
        setResultados(documentosMapeados);
        setMensajeToken(`📊 Cargados ${documentosMapeados.length} documentos existentes de ${tipo}`);
      } else {
("No se encontraron documentos existentes");
        setResultados([]);
      }
    } catch (error) {
("Error cargando documentos existentes:", error);
      setResultados([]);
    }
  };

  const iniciarPollingDocumentos = (tipo) => {
    // Polling cada 3 segundos para verificar nuevos documentos
    const interval = setInterval(async () => {
      try {
        const resultado = await DianService.obtenerDocumentosRecientes(tipo, 100);
        if (resultado.success && resultado.documentos) {
          // Mapear los campos de la base de datos a los campos esperados por la tabla
          const documentosMapeados = resultado.documentos.map(doc => ({
            fecha_recepcion: doc.fecha_recepcion,
            fecha_emision: doc.fecha_emision,
            prefijo: doc.numero_documento?.split('-')[0] || '-',
            numero_documento: doc.numero_documento,
            tipo_documento: doc.tipo_documento,
            nit_emisor: doc.emisor?.split(' - ')[0] || '-',
            emisor: doc.emisor,
            nit_receptor: doc.receptor?.split(' - ')[0] || '-',
            receptor: doc.receptor,
            resultado: doc.estado,
            estado: doc.estado,
            valor_total: doc.monto_total
          }));
          setResultados(documentosMapeados);
        }
      } catch (error) {
("Error en polling:", error);
      }
    }, 3000);

    // Limpiar intervalo después de 2 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 120000);
  };

  // Datos simulados para la tabla y el gráfico (comentado por no uso actual)
  // const dataTable = [
  //   { recepcion: "2025-05-19 14:09:57", emision: "2025-05-19 00:00:00", doc: "SETP990000121", tipo: "Factura electrónica", emisor: "DIGITAL BÚHO SAS", receptor: "INVERSIONES DAVAL SAS", estado: "Aprobado con notificación", monto: "960000.01" },
  //   { recepcion: "2025-05-19 14:08:49", emision: "2025-05-19 00:00:00", doc: "SETP990000120", tipo: "Factura electrónica", emisor: "DIGITAL BÚHO SAS", receptor: "INVERSIONES DAVAL SAS", estado: "Aprobado con notificación", monto: "900000.01" },
  //   { recepcion: "2025-05-19 13:56:07", emision: "2025-05-19 00:00:00", doc: "SETP990000116", tipo: "Factura electrónica", emisor: "DIGITAL BÚHO SAS", receptor: "INVERSIONES DAVAL SAS", estado: "Aprobado con notificación", monto: "961100" },
  //   { recepcion: "2025-05-19 13:52:04", emision: "2025-05-19 00:00:00", doc: "SETP990000114", tipo: "Factura electrónica", emisor: "DIGITAL BÚHO SAS", receptor: "INVERSIONES DAVAL SAS", estado: "Aprobado con notificación", monto: "960000.01" },
  //   { recepcion: "2025-05-19 13:45:11", emision: "2025-05-19 00:00:00", doc: "SETP990000112", tipo: "Factura electrónica", emisor: "DIGITAL BÚHO SAS", receptor: "INVERSIONES DAVAL SAS", estado: "Aprobado con notificación", monto: "900000" },
  // ];

  if (!open) return null;

  // Pantalla de selección inicial
  if (screen === "modal") {
    return (
      <div className="modal-dian-overlay">
        <div className="modal-dian-card fade-in modal-dian-fullscreen">
          <button className="modal-dian-close" onClick={onClose} aria-label="Cerrar">×</button>
          <div className="modal-dian-header">
            <div className="modal-dian-icons">
              <span className="modal-dian-icon-app">🗂️</span>
              <span className="modal-dian-connector"></span>
              <span className="modal-dian-icon-dian">💼</span>
            </div>
            <h2>Conectarse a la DIAN</h2>
          </div>
          <p className="modal-dian-desc">
            Para ingresar tus credenciales, selecciona el tipo de registro que tienes en la DIAN.
          </p>
          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              border: '1px solid #f5c6cb', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <div className="modal-dian-actions">
            <button className="modal-dian-btn modal-dian-btn-juridica" onClick={() => setScreen("juridica")}>Persona jurídica</button>
            <button className="modal-dian-btn modal-dian-btn-juridica" onClick={() => setScreen("natural")}>Persona natural</button>
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button 
              className="modal-dian-btn modal-dian-btn-info" 
              style={{ background: '#2563eb', color: 'white' }} 
              disabled={abriendoPagina || paginaAbierta}
              onClick={async () => {
("🔍 Botón 'Abrir Página DIAN' presionado");
("Estado paginaAbierta:", paginaAbierta);
("Estado abriendoPagina:", abriendoPagina);
                
                if (abriendoPagina || paginaAbierta) {
("🚫 Botón deshabilitado, no se ejecuta");
                  return;
                }
                
("🚀 Abriendo página de DIAN...");
                setAbriendoPagina(true);
                setPaginaAbierta(true);
                
                try {
                  const resultado = await DianService.abrirPaginaLogin();
("📡 Respuesta del servidor:", resultado);
                  if (resultado.success) {
                    setMensajeToken("✅ Página de DIAN abierta correctamente");
                  } else {
                    setMensajeToken("❌ Error: " + resultado.message);
                    setPaginaAbierta(false); // Resetear si falla
                  }
                } catch (error) {
("❌ Error al abrir página:", error);
                  setMensajeToken("❌ Error al abrir página: " + error.message);
                  setPaginaAbierta(false); // Resetear si falla
                } finally {
                  setAbriendoPagina(false);
                }
              }}
            >
              {abriendoPagina ? "⏳ Abriendo..." : paginaAbierta ? "✅ Página Abierta" : "🌐 Abrir Página DIAN"}
            </button>
          </div>
          {paginaAbierta && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <button 
                className="modal-dian-btn modal-dian-btn-secondary" 
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={async () => {
                  try {
                    const resultado = await DianService.cerrarSesion();
                    if (resultado.success) {
                      setPaginaAbierta(false);
                      setMensajeToken("✅ Sesión cerrada correctamente");
                    } else {
                      setMensajeToken("❌ Error al cerrar sesión: " + resultado.message);
                    }
                  } catch (error) {
                    setMensajeToken("❌ Error al cerrar sesión: " + error.message);
                  }
                }}
              >
                🔒 Cerrar Sesión
              </button>
            </div>
          )}
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button 
              className="modal-dian-btn modal-dian-btn-info" 
              style={{ background: '#2563eb', color: 'white' }} 
              onClick={() => setScreen("tokenurl")}
            >
              Ingresar con URL/token de la DIAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla para pegar la URL/token de la DIAN y buscar documentos
  if (screen === "tokenurl") {
    return (
      <div className="modal-dian-overlay">
        <div className="modal-dian-card fade-in modal-dian-fullscreen" style={{ 
          maxWidth: '100%', 
          width: '100%', 
          margin: '0 auto',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <button className="modal-dian-close" onClick={onClose} aria-label="Cerrar">×</button>
          
          {/* Header fijo */}
          <div style={{ flexShrink: 0, padding: '20px' }}>
            <h2 className="modal-dian-header" style={{ textAlign: 'center', marginBottom: 16 }}>Consultar documentos DIAN</h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
              Pega aquí la URL que recibiste en tu correo de la DIAN, selecciona el rango de fechas y consulta los documentos enviados o recibidos.
            </p>
          </div>
          
          {/* Contenido con scroll */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '0 20px 20px 20px'
          }}>
            <form onSubmit={e => e.preventDefault()}>
              <input
                type="text"
                value={tokenUrl}
                onChange={e => setTokenUrl(e.target.value)}
                placeholder="Pega aquí la URL del token de la DIAN..."
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
                required
              />
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label>Desde</label>
                  <input type="date" value={form.desde} onChange={e => setForm(f => ({ ...f, desde: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Hasta</label>
                  <input type="date" value={form.hasta} onChange={e => setForm(f => ({ ...f, hasta: e.target.value }))} required style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                  className="modal-dian-btn modal-dian-btn-juridica modal-dian-btn-block"
                  type="button"
                  disabled={!tokenUrl || !form.desde || !form.hasta || loadingToken}
                  onClick={async () => {
                    setMensajeToken("");
                    setLoadingToken(true);
                    setTipoConsulta("enviados");
                    
                    try {
("🔍 Iniciando búsqueda de documentos enviados...");
                      
                      // Iniciar extracción en segundo plano
                      const resultado = await DianService.consultarDocumentos(tokenUrl, form.desde, form.hasta, "enviados");
                      
                      if (resultado.success) {
                        setMensajeToken("✅ Extracción iniciada para documentos enviados");
                        
                        // Cargar documentos existentes inmediatamente
                        await cargarDocumentosExistentes("enviados");
                        
                        // Iniciar polling para verificar nuevos documentos
                        iniciarPollingDocumentos("enviados");
                      } else {
                        setMensajeToken("❌ Error: " + resultado.message);
                      }
                    } catch (err) {
                      setMensajeToken("❌ Error: " + err.message);
                    } finally {
                      setLoadingToken(false);
                    }
                  }}
                >
                  {loadingToken && tipoConsulta === "enviados" ? "Buscando..." : "Buscar enviados"}
                </button>
                <button
                  className="modal-dian-btn modal-dian-btn-secondary modal-dian-btn-block"
                  type="button"
                  disabled={!tokenUrl || !form.desde || !form.hasta || loadingToken}
                  onClick={async () => {
                    setMensajeToken("");
                    setLoadingToken(true);
                    setTipoConsulta("recibidos");
                    
                    try {
("🔍 Iniciando búsqueda de documentos recibidos...");
                      
                      // Iniciar extracción en segundo plano
                      const resultado = await DianService.consultarDocumentos(tokenUrl, form.desde, form.hasta, "recibidos");
                      
                      if (resultado.success) {
                        setMensajeToken("✅ Extracción iniciada para documentos recibidos");
                        
                        // Cargar documentos existentes inmediatamente
                        await cargarDocumentosExistentes("recibidos");
                        
                        // Iniciar polling para verificar nuevos documentos
                        iniciarPollingDocumentos("recibidos");
                      } else {
                        setMensajeToken("❌ Error: " + resultado.message);
                      }
                    } catch (err) {
                      setMensajeToken("❌ Error: " + err.message);
                    } finally {
                      setLoadingToken(false);
                    }
                  }}
                >
                  {loadingToken && tipoConsulta === "recibidos" ? "Buscando..." : "Buscar recibidos"}
                </button>
              </div>
              <button
                className="modal-dian-btn modal-dian-btn-secondary modal-dian-btn-block"
                type="button"
                onClick={() => setScreen("modal")}
              >
                Volver
              </button>
              

              
              {mensajeToken && <div style={{ marginTop: 16, color: mensajeToken.startsWith("✅") ? 'green' : 'red' }}>{mensajeToken}</div>}
            </form>
            
            {/* Tabla de resultados */}
            {resultados.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Resultados ({tipoConsulta === "enviados" ? "Enviados" : "Recibidos"})</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="modal-dian-btn modal-dian-btn-success"
                      onClick={async () => {
                        try {
                          setMensajeToken("⏳ Descargando archivo ZIP...");
                          const res = await DianService.descargarDocumentosDIAN(tokenUrl, form.desde, form.hasta, tipoConsulta);
                          if (res.success) {
                            setMensajeToken("✅ Documentos descargados correctamente");
                          } else {
                            setMensajeToken("❌ Error al descargar: " + res.message);
                          }
                        } catch (err) {
                          setMensajeToken("❌ Error al descargar: " + err.message);
                        }
                      }}
                    >
                      📥 Descargar ZIP
                    </button>
                  </div>
                </div>
                
                {/* Información de extracción */}
                <div style={{ 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #0ea5e9', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  <strong>✅ Extracción completada:</strong> Los documentos han sido extraídos de la DIAN y guardados automáticamente en la base de datos.
                </div>
                
                {/* Tabla expandida */}
                <div style={{ 
                  maxHeight: '60vh', 
                  overflow: 'auto', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: '14px'
                  }}>
                    <thead style={{ 
                      backgroundColor: '#f8fafc', 
                      position: 'sticky', 
                      top: 0,
                      zIndex: 10
                    }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Recepción</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Fecha</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Prefijo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>N° documento</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Tipo</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>NIT Emisor</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Emisor</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>NIT Receptor</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Receptor</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Resultado</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Estado RADIAN</th>
                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((doc, index) => (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                        }}>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.fecha_recepcion || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.fecha_emision || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.prefijo || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>{doc.numero_documento || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.tipo_documento || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.nit_emisor || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.emisor || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.nit_receptor || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.receptor || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>{doc.resultado || '-'}</td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: doc.estado?.toLowerCase().includes('aprobado') ? '#dcfce7' : 
                                             doc.estado?.toLowerCase().includes('rechazado') ? '#fef2f2' : '#fef3c7',
                              color: doc.estado?.toLowerCase().includes('aprobado') ? '#166534' : 
                                     doc.estado?.toLowerCase().includes('rechazado') ? '#dc2626' : '#92400e'
                            }}>
                              {doc.estado || '-'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: '500' }}>
                            {doc.valor_total ? `$${parseFloat(doc.valor_total).toLocaleString('es-CO')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Resumen de extracción */}
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <strong>📊 Resumen:</strong> Se extrajeron {resultados.length} documentos del tipo "{tipoConsulta}" 
                  en el rango del {form.desde} al {form.hasta}. Todos los documentos han sido guardados en la base de datos.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de consulta con certificado
  if (screen === "certificado") {
    return (
      <div className="modal-dian-overlay">
        <div className="modal-dian-card fade-in modal-dian-fullscreen" style={{ maxWidth: 1300, width: '98vw', maxHeight: '100vh', overflowY: 'auto' }}>
          <button className="modal-dian-close" onClick={onClose} aria-label="Cerrar">×</button>
          <div className="modal-dian-content-centered" style={{ maxWidth: 1300, width: '100%' }}>
            <div className="modal-dian-form-grafico-row2">
              <div className="modal-dian-form-col">
                <form className="modal-dian-form" onSubmit={handleSubmitCertificado}>
                  <h2 className="modal-dian-header" style={{ textAlign: 'center', marginBottom: 16 }}>Consulta de Documentos DIAN</h2>
                  {error && (
                    <div style={{ 
                      backgroundColor: '#fee2e2', 
                      color: '#dc2626', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      {error}
                    </div>
                  )}
                  <div className="modal-dian-field">
                    <label htmlFor="nit">Cédula o NIT <span>*</span></label>
                    <input
                      id="nit"
                      name="nit"
                      type="text"
                      placeholder="1004121459"
                      value={form.nit}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="modal-dian-field">
                    <label htmlFor="password">Contraseña del certificado <span>*</span></label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="********"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="modal-dian-field">
                    <label htmlFor="file">Certificado (.pfx/.p12) <span>*</span></label>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="modal-dian-form-row">
                    <div className="modal-dian-form-group">
                      <label>Tipo de filtro</label>
                      <select name="filtro" disabled>
                        <option>Rango de fechas</option>
                      </select>
                    </div>
                    <div className="modal-dian-form-group">
                      <label htmlFor="desde">Desde <span>*</span></label>
                      <input
                        id="desde"
                        name="desde"
                        type="date"
                        value={form.desde}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="modal-dian-form-group">
                      <label htmlFor="hasta">Hasta <span>*</span></label>
                      <input
                        id="hasta"
                        name="hasta"
                        type="date"
                        value={form.hasta}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-dian-form-row">
                    <button
                      className="modal-dian-btn modal-dian-btn-juridica modal-dian-btn-block"
                      type="submit"
                      disabled={!isValidCertificado || loading}
                      style={{ opacity: isValidCertificado && !loading ? 1 : 0.6, cursor: isValidCertificado && !loading ? 'pointer' : 'not-allowed', marginRight: 8 }}
                    >
                      {loading ? "Consultando..." : "Consultar por fechas"}
                    </button>
                    <button
                      className="modal-dian-btn modal-dian-btn-secondary modal-dian-btn-block"
                      type="button"
                      style={{ marginLeft: 8 }}
                    >
                      Ver documentos existentes
                    </button>
                  </div>
                  <div className="modal-dian-form-row">
                    <button
                      className="modal-dian-btn modal-dian-btn-secondary modal-dian-btn-block"
                      type="button"
                      onClick={() => setScreen("modal")}
                      style={{ marginTop: '8px' }}
                    >
                      Volver
                    </button>
                  </div>
                </form>
              </div>
              {/* Aquí iría el gráfico, puedes reemplazarlo por el componente real si lo tienes */}
              <div className="modal-dian-grafico-col">
                <div className="modal-dian-grafico-panel">
                  <h3>Gráfico de Documentos</h3>
                  {/* Ejemplo de gráfico, reemplaza por tu componente real */}
                  <svg width="180" height="180">
                    <circle cx="90" cy="90" r="80" fill="#f3f4f6" />
                    <path d="M90,90 L90,10 A80,80 0 1,1 170,90 Z" fill="#3b82f6" />
                    <path d="M90,90 L170,90 A80,80 0 0,1 90,10 Z" fill="#a78bfa" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ color: '#3b82f6', fontSize: 12 }}>■ Factura electrónica</span>
                    <span style={{ color: '#a78bfa', fontSize: 12 }}>■ Documento equivalente POS</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Títulos de columna siempre visibles */}
            <div className="tabla-scroll" style={{ maxHeight: 350, overflowY: 'auto', overflowX: 'hidden', marginTop: 24, width: '100%' }}>
              <div className="titulos-columnas-fijas">
                {TITULOS.map((titulo, idx) => (
                  <div className="titulo-columna-fija" key={idx}>{titulo}</div>
                ))}
              </div>
              {/* Tabla de resultados solo si showResults */}
              {showResults && <ResultadosTabla data={documentos} />}
            </div>
            
            {/* Panel de procesamiento automático */}
            {showResults && (
              <ProcesamientoPanel 
                documentos={documentos}
                onProcesarCompleto={(resultado) => {
("Procesamiento completado:", resultado);
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Persona Jurídica
  if (screen === "juridica") {
    const isValidJuridica = form.tipoDoc && form.docRep && form.nitEmpresa;
    return (
      <div className="modal-dian-overlay">
        <div className="modal-dian-card modal-dian-fullscreen fade-in">
          <button className="modal-dian-close" onClick={onClose} aria-label="Cerrar">×</button>
          <div className="modal-dian-content-centered">
            <form className="modal-dian-form" style={{ maxWidth: 480, margin: '0 auto' }} onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError("");
              
              try {
                // Usar el nuevo servicio de automatización para persona jurídica
                const resultado = await DianService.procesarPersonaJuridica(
                  form.tipoDoc,
                  form.docRep,
                  form.nitEmpresa
                );
                
                if (resultado.success) {
                  setMensajeToken("✅ Formulario enviado exitosamente. Revise su correo para el token.");
                  onClose(); // Cerrar modal
                } else {
                  if (resultado.data && resultado.data.captcha_requerido) {
                    setError("CAPTCHA detectado. Complete el CAPTCHA manualmente en el navegador y luego haga clic en 'Entrar'.");
                  } else {
                    setError(resultado.message || "Error en el procesamiento");
                  }
                }
              } catch (error) {
                setError("Error al procesar: " + error.message);
              } finally {
                setLoading(false);
              }
            }}>
              <h2 className="modal-dian-header" style={{ textAlign: 'center', marginBottom: 16 }}>Conectarse a la DIAN</h2>
              <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
                Necesitarás acceso al correo registrado en el RUT del representante legal de la empresa para recibir el <b>token de acceso</b> que te enviará la DIAN.
              </p>
              <div className="modal-dian-field">
                <label htmlFor="tipoDoc">Tipo de documento del Representante legal <span>*</span></label>
                <select
                  id="tipoDoc"
                  name="tipoDoc"
                  value={form.tipoDoc}
                  onChange={handleChange}
                  required
                >
                  <option value="">Tipo de identificación</option>
                  {tiposDocumentoJuridica.map((tipo, index) => (
                    <option key={index} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              <div className="modal-dian-field">
                <label htmlFor="docRep">NIT del Representante legal <span>*</span></label>
                <input
                  id="docRep"
                  name="docRep"
                  type="text"
                  placeholder="Ingresa la identificación del representante legal"
                  value={form.docRep}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="modal-dian-field">
                <label htmlFor="nitEmpresa">NIT empresa <span>*</span></label>
                <input
                  id="nitEmpresa"
                  name="nitEmpresa"
                  type="text"
                  placeholder="Ingresa el NIT de la empresa"
                  value={form.nitEmpresa}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
              <button
                className="modal-dian-btn modal-dian-btn-juridica modal-dian-btn-block"
                type="submit"
                disabled={!isValidJuridica || loading}
                style={{ opacity: isValidJuridica && !loading ? 1 : 0.6, cursor: isValidJuridica && !loading ? 'pointer' : 'not-allowed', marginTop: 18 }}
              >
                {loading ? "Procesando..." : "Continuar"}
              </button>
              <button
                className="modal-dian-btn modal-dian-btn-secondary modal-dian-btn-block"
                type="button"
                onClick={() => setScreen("modal")}
                style={{ marginTop: 8 }}
              >
                Volver
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Persona Natural
  if (screen === "natural") {
    const isValidNatural = form.tipoDoc && form.docRep && form.token && form.fecha;
    return (
      <div className="modal-dian-overlay">
        <div className="modal-dian-card modal-dian-fullscreen fade-in">
          <button className="modal-dian-close" onClick={onClose} aria-label="Cerrar">×</button>
          <div className="modal-dian-content-centered">
                          <form className="modal-dian-form" style={{ maxWidth: 480, margin: '0 auto' }} onSubmit={handleSubmitToken}>
                <h2 className="modal-dian-header" style={{ textAlign: 'center', marginBottom: 16 }}>Conectarse a la DIAN</h2>
                {error && (
                  <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#dc2626', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}
              <div className="modal-dian-field">
                <label htmlFor="tipoDoc">Tipo de documento <span>*</span></label>
                <select
                  id="tipoDoc"
                  name="tipoDoc"
                  value={form.tipoDoc}
                  onChange={handleChange}
                  required
                >
                  <option value="">Tipo de identificación</option>
                  {tiposDocumentoNatural.map((tipo, index) => (
                    <option key={index} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
              </div>
              <div className="modal-dian-field">
                <label htmlFor="docRep">Cedula del contribuyente <span>*</span></label>
                <input
                  id="docRep"
                  name="docRep"
                  type="text"
                  placeholder="Ejemplo: 123456789"
                  value={form.docRep}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="modal-dian-field">
                <label htmlFor="token">Token de autenticación <span>*</span></label>
                <input
                  id="token"
                  name="token"
                  type="password"
                  placeholder="Token enviado por la DIAN"
                  value={form.token}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="modal-dian-field">
                <label htmlFor="fecha">Fecha de consulta <span>*</span></label>
                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                className="modal-dian-btn modal-dian-btn-juridica modal-dian-btn-block"
                type="submit"
                disabled={!isValidNatural || loading}
                style={{ opacity: isValidNatural && !loading ? 1 : 0.6, cursor: isValidNatural && !loading ? 'pointer' : 'not-allowed', marginTop: 18 }}
              >
                {loading ? "Consultando..." : "Consultar Documentos"}
              </button>
              <button
                className="modal-dian-btn modal-dian-btn-secondary modal-dian-btn-block"
                type="button"
                onClick={() => setScreen("modal")}
                style={{ marginTop: 8 }}
              >
                Volver
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ModalDIAN; 