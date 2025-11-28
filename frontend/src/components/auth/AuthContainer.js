import React, { useEffect, useState } from 'react';
import ForgotPassword from './ForgotPassword';
import Login from './Login.js';
import Register from './Register.js';
import ResetPassword from './ResetPassword';

const AuthContainer = () => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot', 'reset'
  const [resetToken, setResetToken] = useState(null);

  // Verificar si hay un token de reset en la URL
  useEffect(() => {
    const checkResetToken = () => {
      // Intentar obtener token de diferentes formatos de URL
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get('token');
      
      // También verificar si está en el pathname (ej: /reset-password/token)
      if (!token) {
        const pathParts = window.location.pathname.split('/');
        const resetIndex = pathParts.indexOf('reset-password');
        if (resetIndex !== -1 && pathParts[resetIndex + 1]) {
          token = pathParts[resetIndex + 1];
        }
      }
      
      // También verificar hash (ej: #token=xxx)
      if (!token && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        token = hashParams.get('token');
      }
      
      if (token) {
        setResetToken(token);
        setMode('reset');
        // Limpiar URL para evitar problemas (remover query string y hash)
        const cleanPath = window.location.pathname || '/';
        window.history.replaceState({}, document.title, cleanPath);
      }
    };
    
    checkResetToken();
  }, []);

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setResetToken(null);
  };

  const handleBackToLogin = () => {
    setMode('login');
    setResetToken(null);
    // Limpiar URL
    window.history.replaceState({}, document.title, '/');
  };

  if (mode === 'reset') {
    return <ResetPassword token={resetToken} onBackToLogin={handleBackToLogin} />;
  }

  if (mode === 'forgot') {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  if (mode === 'register') {
    return <Register onToggleMode={() => handleToggleMode('login')} />;
  }

  return <Login onToggleMode={() => handleToggleMode('register')} onForgotPassword={() => handleToggleMode('forgot')} />;
};

export default AuthContainer;