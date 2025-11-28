import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ComprobanteService from '../../services/comprobanteService';

const TiposComprobantes = ({ empresaId, loading: parentLoading }) => {
  const { token } = useAuth();
  const [comprobantes, setComprobantes] = useState({
    ventas: {
      factura: { activo: false, codigo: '', id: null },
      nota_credito: { activo: false, codigo: '', id: null },
      nota_debito: { activo: false, codigo: '', id: null }
    },
    compras: {
      factura: { activo: false, codigo: '', id: null },
      nota_credito: { activo: false, codigo: '', id: null },
      nota_debito: { activo: false, codigo: '', id: null }
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    if (empresaId && token) {
      cargarComprobantes();
    }
  }, [empresaId, token]);

  const cargarComprobantes = async () => {
    if (!empresaId || !token) return;
    
    setLoading(true);
    try {
      const [ventasResponse, comprasResponse] = await Promise.all([
        ComprobanteService.getComprobantes(empresaId, 'venta', token),
        ComprobanteService.getComprobantes(empresaId, 'compra', token)
      ]);

      const nuevosComprobantes = {
        ventas: {
          factura: { activo: false, codigo: '', id: null },
          nota_credito: { activo: false, codigo: '', id: null },
          nota_debito: { activo: false, codigo: '', id: null }
        },
        compras: {
          factura: { activo: false, codigo: '', id: null },
          nota_credito: { activo: false, codigo: '', id: null },
          nota_debito: { activo: false, codigo: '', id: null }
        }
      };

      if (ventasResponse.success && ventasResponse.data) {
        ventasResponse.data.forEach(comp => {
          if (nuevosComprobantes.ventas[comp.tipo_comprobante]) {
            nuevosComprobantes.ventas[comp.tipo_comprobante] = {
              activo: comp.activo,
              codigo: comp.codigo || '',
              id: comp.id
            };
          }
        });
      }

      if (comprasResponse.success && comprasResponse.data) {
        comprasResponse.data.forEach(comp => {
          if (nuevosComprobantes.compras[comp.tipo_comprobante]) {
            nuevosComprobantes.compras[comp.tipo_comprobante] = {
              activo: comp.activo,
              codigo: comp.codigo || '',
              id: comp.id
            };
          }
        });
      }

      setComprobantes(nuevosComprobantes);
    } catch (error) {
      console.error('Error cargando comprobantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const guardarComprobante = async (categoria, tipo, activo, codigo) => {
    if (!empresaId || !token) return;
    
    const key = `${categoria}_${tipo}`;
    setSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const comprobante = comprobantes[categoria][tipo];
      if (comprobante.id) {
        await ComprobanteService.updateComprobante(
          comprobante.id,
          empresaId,
          { activo, codigo },
          token
        );
      } else {
        const response = await ComprobanteService.createComprobante(
          empresaId,
          {
            tipo_comprobante: tipo,
            categoria: categoria === 'ventas' ? 'venta' : 'compra',
            codigo,
            activo
          },
          token
        );
        if (response.success && response.data) {
          setComprobantes(prev => ({
            ...prev,
            [categoria]: {
              ...prev[categoria],
              [tipo]: { ...prev[categoria][tipo], id: response.data.id }
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error guardando comprobante:', error);
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleToggle = async (categoria, tipo) => {
    const nuevoEstado = !comprobantes[categoria][tipo].activo;
    const codigo = comprobantes[categoria][tipo].codigo;
    
    setComprobantes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [tipo]: { ...prev[categoria][tipo], activo: nuevoEstado }
      }
    }));
    
    await guardarComprobante(categoria, tipo, nuevoEstado, codigo);
  };

  const handleCodigoChange = (categoria, tipo, codigo) => {
    setComprobantes(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [tipo]: { ...prev[categoria][tipo], codigo }
      }
    }));
  };

  const handleCodigoBlur = async (categoria, tipo) => {
    const codigo = comprobantes[categoria][tipo].codigo;
    const activo = comprobantes[categoria][tipo].activo;
    
    if (codigo && (activo || empresaId)) {
      await guardarComprobante(categoria, tipo, activo, codigo);
    }
  };

  const tipos = [
    { key: 'factura', label: 'Factura' },
    { key: 'nota_credito', label: 'Nota Crédito' },
    { key: 'nota_debito', label: 'Nota Débito' }
  ];

  return (
    <div className="tipos-comprobantes-container" style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="form-section tipos-comprobantes-section">
        <div className="comprobantes-vertical-layout">
          {/* Sección de Ventas */}
          <div className="comprobantes-categoria-section">
            <h3 className="categoria-title">📈 Comprobantes de Ventas</h3>
            <div className="comprobantes-list-vertical">
              {tipos.map(tipo => {
                const key = `ventas_${tipo.key}`;
                const comp = comprobantes.ventas[tipo.key];
                return (
                  <div key={tipo.key} className="comprobante-row-vertical">
                    <div className="comprobante-info">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={comp.activo}
                          onChange={() => handleToggle('ventas', tipo.key)}
                          disabled={loading || parentLoading || saving[key]}
                        />
                        <span className="checkmark"></span>
                        <span className="comprobante-name">📄 {tipo.label}</span>
                      </label>
                    </div>
                    <div className="comprobante-codigo">
                      <label htmlFor={`codigo-venta-${tipo.key}`}>Código:</label>
                      <input
                        type="text"
                        id={`codigo-venta-${tipo.key}`}
                        value={comp.codigo}
                        onChange={(e) => handleCodigoChange('ventas', tipo.key, e.target.value)}
                        onBlur={() => handleCodigoBlur('ventas', tipo.key)}
                        placeholder="Ej: 01"
                        disabled={loading || parentLoading || saving[key]}
                        className="codigo-input-simple"
                        maxLength="3"
                      />
                      {saving[key] && <span className="saving-indicator">💾</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección de Compras */}
          <div className="comprobantes-categoria-section">
            <h3 className="categoria-title">🛒 Comprobantes de Compras</h3>
            <div className="comprobantes-list-vertical">
              {tipos.map(tipo => {
                const key = `compras_${tipo.key}`;
                const comp = comprobantes.compras[tipo.key];
                return (
                  <div key={tipo.key} className="comprobante-row-vertical">
                    <div className="comprobante-info">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={comp.activo}
                          onChange={() => handleToggle('compras', tipo.key)}
                          disabled={loading || parentLoading || saving[key]}
                        />
                        <span className="checkmark"></span>
                        <span className="comprobante-name">📄 {tipo.label}</span>
                      </label>
                    </div>
                    <div className="comprobante-codigo">
                      <label htmlFor={`codigo-compra-${tipo.key}`}>Código:</label>
                      <input
                        type="text"
                        id={`codigo-compra-${tipo.key}`}
                        value={comp.codigo}
                        onChange={(e) => handleCodigoChange('compras', tipo.key, e.target.value)}
                        onBlur={() => handleCodigoBlur('compras', tipo.key)}
                        placeholder="Ej: 01"
                        disabled={loading || parentLoading || saving[key]}
                        className="codigo-input-simple"
                        maxLength="3"
                      />
                      {saving[key] && <span className="saving-indicator">💾</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiposComprobantes;

