import React from 'react';
import './Tabs.css';

const Tabs = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            disabled={tab.disabled}
            type="button"
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.badge && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {children}
      </div>
    </div>
  );
};

export default Tabs;

