import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ComprobanteService from '../../services/comprobanteService';

const ComprobantesVentas = ({ empresaId, loading: parentLoading }) => {
  const { token } = useAuth();
  const [comprobantes, setComprobantes] = useState({
    factura: { activo: false, codigo: '', id: null },
    nota_credito: { activo: false, codigo: '', id: null },
    nota_debito: { activo: false, codigo: '', id: null }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    if (empresaId && token) {
      cargarComprobantes();
    } else {
      // Si no hay empresaId, inicializar con valores por defecto
      setComprobantes({
        factura: { activo: false, codigo: '01', id: null },
        nota_credito: { activo: false, codigo: '91', id: null },
        nota_debito: { activo: false, codigo: '92', id: null }
      });
    }
  }, [empresaId, token]);

  const cargarComprobantes = async () => {
    if (!empresaId || !token) return;
    
    setLoading(true);
    try {
      const response = await ComprobanteService.getComprobantes(empresaId, 'venta', token);
      if (response.success && response.data) {
        const nuevosComprobantes = {
          factura: { activo: false, codigo: '01', id: null },
          nota_credito: { activo: false, codigo: '91', id: null },
          nota_debito: { activo: false, codigo: '92', id: null }
        };
        
        response.data.forEach(comp => {
          if (nuevosComprobantes[comp.tipo_comprobante]) {
            nuevosComprobantes[comp.tipo_comprobante] = {
              activo: comp.activo,
              codigo: comp.codigo || (comp.tipo_comprobante === 'factura' ? '01' : comp.tipo_comprobante === 'nota_credito' ? '91' : '92'),
              id: comp.id
            };
          }
        });
        
        setComprobantes(nuevosComprobantes);
      }
    } catch (error) {
      console.error('Error cargando comprobantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarComprobante = async (tipo, activo, codigo) => {
    if (!empresaId || !token) {
      // Si no hay empresaId, solo actualizar el estado local
      return;
    }
    
    setSaving(prev => ({ ...prev, [tipo]: true }));
    
    try {
      if (comprobantes[tipo].id) {
        // Actualizar existente
        await ComprobanteService.updateComprobante(
          comprobantes[tipo].id,
          empresaId,
          { activo, codigo },
          token
        );
      } else {
        // Crear nuevo
        const response = await ComprobanteService.createComprobante(
          empresaId,
          {
            tipo_comprobante: tipo,
            categoria: 'venta',
            codigo,
            activo
          },
          token
        );
        if (response.success && response.data) {
          setComprobantes(prev => ({
            ...prev,
            [tipo]: { ...prev[tipo], id: response.data.id }
          }));
        }
      }
    } catch (error) {
      console.error('Error guardando comprobante:', error);
    } finally {
      setSaving(prev => ({ ...prev, [tipo]: false }));
    }
  };

  const handleToggle = async (tipo) => {
    const nuevoEstado = !comprobantes[tipo].activo;
    const codigo = comprobantes[tipo].codigo || (tipo === 'factura' ? '01' : tipo === 'nota_credito' ? '91' : '92');
    
    setComprobantes(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], activo: nuevoEstado, codigo }
    }));
    
    await guardarComprobante(tipo, nuevoEstado, codigo);
  };

  const handleCodigoChange = (tipo, codigo) => {
    setComprobantes(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], codigo }
    }));
  };

  const handleCodigoBlur = async (tipo) => {
    const codigo = comprobantes[tipo].codigo || (tipo === 'factura' ? '01' : tipo === 'nota_credito' ? '91' : '92');
    const activo = comprobantes[tipo].activo;
    
    setComprobantes(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], codigo }
    }));
    
    if (activo || empresaId) {
      await guardarComprobante(tipo, activo, codigo);
    }
  };

  const tipos = [
    { key: 'factura', label: 'Factura', icon: '📄', defaultCodigo: '01' },
    { key: 'nota_credito', label: 'Nota Crédito', icon: '📋', defaultCodigo: '91' },
    { key: 'nota_debito', label: 'Nota Débito', icon: '📝', defaultCodigo: '92' }
  ];

  return (
    <div className="comprobantes-ventas-container">
      <div className="form-section comprobantes-ventas-section">
        <h3 className="section-title">Tipos de Comprobantes - Ventas</h3>
        <div className="comprobantes-grid">
          {tipos.map(tipo => (
            <div key={tipo.key} className="comprobante-card">
              <div className="comprobante-header">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={comprobantes[tipo.key]?.activo || false}
                    onChange={() => handleToggle(tipo.key)}
                    disabled={loading || parentLoading || saving[tipo.key]}
                  />
                  <span className="checkmark"></span>
                  <span className="comprobante-label">
                    {tipo.icon} {tipo.label}
                  </span>
                </label>
              </div>
              <div className="comprobante-config">
                <div className="form-group">
                  <label className="input-label">Código</label>
                  <input
                    type="text"
                    value={comprobantes[tipo.key]?.codigo || ''}
                    onChange={(e) => handleCodigoChange(tipo.key, e.target.value)}
                    onBlur={() => handleCodigoBlur(tipo.key)}
                    placeholder={tipo.defaultCodigo}
                    disabled={loading || parentLoading || saving[tipo.key]}
                    className="codigo-input"
                    maxLength="3"
                  />
                  {saving[tipo.key] && <span className="saving-indicator">💾</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComprobantesVentas;
