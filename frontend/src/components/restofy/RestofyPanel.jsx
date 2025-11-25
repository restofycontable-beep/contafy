import React, { useState } from 'react';
import FacturasElectronicas from '../FacturasElectronicas';
import Tabs from '../Tabs';
import CategoriasRestofy from './CategoriasRestofy';
import ItemsFacturasRestofy from './ItemsFacturasRestofy';
import ProductosRestofy from './ProductosRestofy';
import './RestofyComponents.css';

const RestofyPanel = ({ empresaId, empresa }) => {
  const [activeTab, setActiveTab] = useState('facturas');

  const tabs = [
    {
      id: 'facturas',
      label: 'Facturas Electrónicas',
      icon: '📄',
      disabled: false
    },
    {
      id: 'items',
      label: 'Items de Facturas',
      icon: '🛒',
      disabled: false
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: '📦',
      disabled: false
    },
    {
      id: 'categorias',
      label: 'Categorías',
      icon: '📁',
      disabled: false
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'facturas':
        return (
          <div style={{ padding: '0' }}>
            <FacturasElectronicas empresaId={empresaId} empresa={empresa} />
          </div>
        );
      case 'items':
        return <ItemsFacturasRestofy empresaId={empresaId} empresa={empresa} />;
      case 'productos':
        return <ProductosRestofy empresaId={empresaId} empresa={empresa} />;
      case 'categorias':
        return <CategoriasRestofy empresaId={empresaId} empresa={empresa} />;
      default:
        return (
          <div style={{ padding: '0' }}>
            <FacturasElectronicas empresaId={empresaId} empresa={empresa} />
          </div>
        );
    }
  };

  return (
    <div className="restofy-panel">
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div className="restofy-tab-content">
          {renderTabContent()}
        </div>
      </Tabs>
    </div>
  );
};

export default RestofyPanel;

