import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import AdminPanel from './AdminPanel';
import ConfiguracionEmpresa from './ConfiguracionEmpresa';
import ConfiguracionUsuario from './ConfiguracionUsuario';
import CrearEmpresa from './CrearEmpresa';
import './Dashboard.css';
import GestionarEmpresa from './GestionarEmpresa';
import Header from './Header';
import ListaEmpresas from './ListaEmpresas';

import Sidebar from './Sidebar';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [empresaParaEditar, setEmpresaParaEditar] = useState(null);
  const [empresaParaConfigurar, setEmpresaParaConfigurar] = useState(null);
  const [empresaParaGestionar, setEmpresaParaGestionar] = useState(null);

  // Sincronizar URL con el estado cuando cambia la ruta
  useEffect(() => {
    const path = location.pathname;
    
    if (path.startsWith('/editar-empresa/')) {
      const id = params.id;
      if (id) {
        const empresaId = parseInt(id);
        if (!isNaN(empresaId)) {
          setEmpresaParaEditar(empresaId);
          setEmpresaParaConfigurar(null);
          setEmpresaParaGestionar(null);
        }
      }
    } else if (path.startsWith('/configuracion-empresa/')) {
      const id = params.id;
      if (id) {
        const empresaId = parseInt(id);
        if (!isNaN(empresaId)) {
          setEmpresaParaConfigurar(empresaId);
          setEmpresaParaEditar(null);
          setEmpresaParaGestionar(null);
        }
      }
    } else if (path.startsWith('/gestionar-empresa/')) {
      const id = params.id;
      if (id) {
        const empresaId = parseInt(id);
        if (!isNaN(empresaId)) {
          setEmpresaParaGestionar(empresaId);
          setEmpresaParaEditar(null);
          setEmpresaParaConfigurar(null);
        }
      }
    } else {
      // Limpiar estados de empresa cuando no hay ID en la URL
      setEmpresaParaEditar(null);
      setEmpresaParaConfigurar(null);
      setEmpresaParaGestionar(null);
    }
  }, [location.pathname, params]);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleViewChange = (newView, empresaId = null) => {
    // Cerrar sidebar en móvil cuando se cambia de vista
    setIsSidebarOpen(false);
    
    // Navegar usando React Router
    if (newView === 'editar-empresa' && empresaId) {
      setEmpresaParaEditar(empresaId);
      setEmpresaParaConfigurar(null);
      setEmpresaParaGestionar(null);
      navigate(`/editar-empresa/${empresaId}`);
    } else if (newView === 'configuracion-empresa' && empresaId) {
      setEmpresaParaConfigurar(empresaId);
      setEmpresaParaEditar(null);
      setEmpresaParaGestionar(null);
      navigate(`/configuracion-empresa/${empresaId}`);
    } else if (newView === 'gestionar-empresa' && empresaId) {
      setEmpresaParaGestionar(empresaId);
      setEmpresaParaEditar(null);
      setEmpresaParaConfigurar(null);
      navigate(`/gestionar-empresa/${empresaId}`);
    } else {
      setEmpresaParaEditar(null);
      setEmpresaParaConfigurar(null);
      setEmpresaParaGestionar(null);
      
      // Mapear vistas a rutas
      const routeMap = {
        'dashboard': '/dashboard',
        'crear-empresa': '/crear-empresa',
        'mis-empresas': '/mis-empresas',
        'configuracion': '/configuracion',
        'admin': '/admin'
      };
      
      const route = routeMap[newView] || '/dashboard';
      navigate(route);
    }
  };

  // Determinar la vista activa basada en la URL
  const getActiveView = () => {
    const path = location.pathname;
    
    if (path === '/dashboard' || path === '/') {
      return 'dashboard';
    } else if (path === '/crear-empresa') {
      return 'crear-empresa';
    } else if (path === '/mis-empresas') {
      return 'mis-empresas';
    } else if (path.startsWith('/editar-empresa/')) {
      return 'editar-empresa';
    } else if (path.startsWith('/configuracion-empresa/')) {
      return 'configuracion-empresa';
    } else if (path.startsWith('/gestionar-empresa/')) {
      return 'gestionar-empresa';
    } else if (path === '/configuracion') {
      return 'configuracion';
    } else if (path === '/admin') {
      return 'admin';
    }
    
    return 'dashboard';
  };

  const activeView = getActiveView();

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="dashboard-header">
              <div className="welcome-section">

                <p className="dashboard-subtitle">
                  Bienvenido, <strong>{user?.username || 'Usuario'}</strong>. Gestiona tu información contable de manera eficiente.
                </p>
              </div>

            </div>

            <div className="dashboard-content-inner">
              <div className="dashboard-grid">
              <div className="dashboard-card profile-card">
                <div className="card-header">
                  <h3>👤 Mi Perfil</h3>
                </div>
                <div className="profile-info">
                  <div className="profile-avatar">
                    <div className="avatar-circle">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="profile-details">
                    <div className="info-item">
                      <span className="info-label">Usuario:</span>
                      <span className="info-value">{user?.username || 'No disponible'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{user?.email || 'No disponible'}</span>
                    </div>
                    {user?.full_name && (
                      <div className="info-item">
                        <span className="info-label">Nombre:</span>
                        <span className="info-value">{user.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="dashboard-card actions-card">
                <div className="card-header">
                  <h3>⚡ Acciones Principales</h3>
                </div>
                <div className="main-actions">
                  <button 
                    className="main-action-btn primary"
                    onClick={() => handleViewChange('crear-empresa')}
                  >
                    <div className="action-icon">🏢</div>
                    <div className="action-content">
                      <div className="action-title">Crear Empresa</div>
                      <div className="action-subtitle">Nueva empresa para gestionar</div>
                    </div>
                  </button>
                  
                  <button 
                    className="main-action-btn secondary"
                    onClick={() => handleViewChange('mis-empresas')}
                  >
                    <div className="action-icon">📋</div>
                    <div className="action-content">
                      <div className="action-title">Gestionar Empresas</div>
                      <div className="action-subtitle">Ver y editar empresas existentes</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="dashboard-card system-card">
                <div className="card-header">
                  <h3>ℹ️ Información del Sistema</h3>
                  <span className="card-subtitle">Estado y configuración</span>
                </div>
                <div className="system-info">
                  <div className="system-item">
                    <span className="system-icon">🔐</span>
                    <div className="system-content">
                      <div className="system-label">Autenticación</div>
                      <div className="system-value">JWT Token Activo</div>
                    </div>
                  </div>
                  <div className="system-item">
                    <span className="system-icon">🌐</span>
                    <div className="system-content">
                      <div className="system-label">Servidor</div>
                      <div className="system-value">Conectado</div>
                    </div>
                  </div>
                  <div className="system-item">
                    <span className="system-icon">📅</span>
                    <div className="system-content">
                      <div className="system-label">Último acceso</div>
                      <div className="system-value">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="system-item">
                    <span className="system-icon">⚡</span>
                    <div className="system-content">
                      <div className="system-label">Estado</div>
                      <div className="system-value">
                        <span className="status-badge active">Activo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        );

      case 'crear-empresa':
        return <CrearEmpresa key="crear-empresa" onViewChange={handleViewChange} />;
      case 'editar-empresa':
        return <CrearEmpresa key={`editar-empresa-${empresaParaEditar}`} empresaId={empresaParaEditar} onViewChange={handleViewChange} />;
      case 'configuracion-empresa':
        return <ConfiguracionEmpresa empresaId={empresaParaConfigurar} onViewChange={handleViewChange} />;
      case 'gestionar-empresa':
        return <GestionarEmpresa empresaId={empresaParaGestionar} onViewChange={handleViewChange} />;
      case 'mis-empresas':
        return <ListaEmpresas onViewChange={handleViewChange} onEmpresaSelect={setEmpresaSeleccionada} />;
      case 'admin':
        return <AdminPanel onViewChange={handleViewChange} />;
      case 'configuracion':
        return <ConfiguracionUsuario onViewChange={handleViewChange} />;
      default:
        return (
          <div className="dashboard-content">
            <div className="dashboard-grid">
              <div className="dashboard-card">
                <h3>👤 Mi Perfil</h3>
                <div className="profile-info">
                  <div className="info-item">
                    <strong>Usuario:</strong> {user?.username || 'No disponible'}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {user?.email || 'No disponible'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <Header 
        user={user} 
        onLogout={logout}
        onMenuToggle={handleMenuToggle}
        isSidebarOpen={isSidebarOpen}
      />
      {/* Overlay para móvil cuando sidebar está abierto */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={handleCloseSidebar}
      ></div>
      <div className="dashboard-content">
        <Sidebar 
          activeView={activeView} 
          onViewChange={handleViewChange}
          isOpen={isSidebarOpen}
        />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
