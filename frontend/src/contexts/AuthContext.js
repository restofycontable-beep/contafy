import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

  // Configurar headers de autorización
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Interceptor para manejar errores 401 y reautenticar
  const fetchWithAuth = async (url, options = {}) => {
    const headers = getAuthHeaders();
    
    // Construir URL completa si es relativa
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    try {
      // Primera petición
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      // Si es 401 y tenemos token, mostrar error claro
      if (response.status === 401 && token) {
        console.warn('🔒 Token expirado - debes volver a iniciar sesión');
        
        // Mostrar alerta al usuario
        alert('⚠️ Tu sesión ha expirado. Por favor, vuelve a iniciar sesión para guardar tus cambios.');
        
        // Hacer logout automático
        logout();
        
        // Retornar el error original
        return response;
      }

      return response;
    } catch (error) {
      // Manejar errores de red correctamente
      console.error('❌ Error en fetchWithAuth:', error);
      
      // Si es error de red, crear respuesta simulada para manejo consistente
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        // Retornar objeto que simula Response para manejo consistente
        return {
          ok: false,
          status: 0,
          statusText: 'Network Error',
          json: async () => ({ 
            success: false, 
            error: 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.' 
          }),
          text: async () => 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'
        };
      }
      
      // Re-lanzar otros errores para que sean manejados por el componente
      throw error;
    }
  };

  // Verificar token al cargar la app
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          console.log('🔍 Verificando token al iniciar...', token.substring(0, 50));
          
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: getAuthHeaders(),
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Token válido, usuario cargado:', userData.username);
            setUser(userData);
          } else {
            console.warn('❌ Token inválido, haciendo logout');
            logout();
          }
        } catch (error) {
          console.error('❌ Error verificando token:', error);
          logout();
        }
      } else {
        console.log('ℹ️ No hay token guardado');
      }
      setLoading(false);
    };

    // Solo ejecutar si no está cargando para evitar bucles
    if (loading) {
      initAuth();
    }
  }, []); // ← Cambiar dependencia para evitar bucle infinito

  // Login
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token, user: userData } = data;
        
        // Guardar token y usuario
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Error al iniciar sesión' 
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        success: false, 
        error: 'Error de conexión. Verifica tu conexión a internet.' 
      };
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        const { access_token, user: newUser } = data;
        
        // Guardar token y usuario
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(newUser);
        
        return { success: true, user: newUser };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Error al registrar usuario' 
        };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      return { 
        success: false, 
        error: 'Error de conexión. Verifica tu conexión a internet.' 
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        return { success: true, user: data };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Error al actualizar perfil' 
        };
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return { 
        success: false, 
        error: 'Error de conexión' 
      };
    }
  };

  // Cambiar contraseña
  const changePassword = async (passwordData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Error al cambiar contraseña' 
        };
      }
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return { 
        success: false, 
        error: 'Error de conexión' 
      };
    }
  };

  // Solicitar reset de contraseña
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Error al solicitar recuperación de contraseña' 
        };
      }
    } catch (error) {
      console.error('Error solicitando reset de contraseña:', error);
      return { 
        success: false, 
        error: 'Error de conexión. Verifica tu conexión a internet.' 
      };
    }
  };

  // Validar token de reset
  const validateResetToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { 
          success: true, 
          valid: data.valid || false,
          message: data.message 
        };
      } else {
        return { 
          success: false, 
          valid: false,
          error: data.detail || 'Error al validar token' 
        };
      }
    } catch (error) {
      console.error('Error validando token:', error);
      return { 
        success: false, 
        valid: false,
        error: 'Error de conexión. Verifica tu conexión a internet.' 
      };
    }
  };

  // Resetear contraseña
  const resetPassword = async (token, newPassword, confirmPassword) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { 
          success: false, 
          error: data.detail || 'Error al restablecer contraseña' 
        };
      }
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      return { 
        success: false, 
        error: 'Error de conexión. Verifica tu conexión a internet.' 
      };
    }
  };

  const contextValue = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    getAuthHeaders,
    fetchWithAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    validateResetToken,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};