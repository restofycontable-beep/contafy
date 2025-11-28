import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import Header from '../../components/shared/Header';
import Sidebar from '../../components/shared/Sidebar';
import AdminPanel from '../Admin/AdminPanel';
import ConfiguracionUsuario from '../Configuracion/ConfiguracionUsuario';
import ConfiguracionEmpresa from '../Empresas/ConfiguracionEmpresa';
import CrearEmpresa from '../Empresas/CrearEmpresa';
import GestionarEmpresa from '../Empresas/GestionarEmpresa';
import ListaEmpresas from '../Empresas/ListaEmpresas';
import './Dashboard.css';

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
          // Cargar empresa para mostrarla en el header
          // TODO: Cargar empresa desde API si es necesario
        }
      }
    } else {
      // Limpiar estados de empresa cuando no hay ID en la URL
      setEmpresaParaEditar(null);
      setEmpresaParaConfigurar(null);
      setEmpresaParaGestionar(null);
      setEmpresaSeleccionada(null);
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
    
    // Redirigir dashboard a mis-empresas
    if (path === '/dashboard' || path === '/') {
      return 'mis-empresas';
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
    
    return 'mis-empresas';
  };

  const activeView = getActiveView();

  // Redirigir automáticamente a mis-empresas cuando se accede a dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/') {
      navigate('/mis-empresas', { replace: true });
    }
  }, [location.pathname, navigate]);

  const renderContent = () => {
    switch (activeView) {
      case 'crear-empresa':
        return <CrearEmpresa key="crear-empresa" onViewChange={handleViewChange} />;
      case 'editar-empresa':
        return <CrearEmpresa key={`editar-empresa-${empresaParaEditar}`} empresaId={empresaParaEditar} onViewChange={handleViewChange} />;
      case 'configuracion-empresa':
        return <ConfiguracionEmpresa empresaId={empresaParaConfigurar} onViewChange={handleViewChange} />;
      case 'gestionar-empresa':
        return (
          <GestionarEmpresa 
            empresaId={empresaParaGestionar} 
            onViewChange={handleViewChange}
            onEmpresaLoaded={setEmpresaSeleccionada}
          />
        );
      case 'mis-empresas':
        return (
          <ListaEmpresas 
            onViewChange={handleViewChange} 
            onEmpresaSelect={setEmpresaSeleccionada}
          />
        );
      case 'admin':
        return <AdminPanel onViewChange={handleViewChange} />;
      case 'configuracion':
        return <ConfiguracionUsuario onViewChange={handleViewChange} />;
      default:
        return <ListaEmpresas onViewChange={handleViewChange} onEmpresaSelect={setEmpresaSeleccionada} />;
    }
  };

  return (
    <div className="dashboard">
      <Header 
        user={user} 
        onLogout={logout}
        onMenuToggle={handleMenuToggle}
        isSidebarOpen={isSidebarOpen}
        empresaActiva={empresaSeleccionada}
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
