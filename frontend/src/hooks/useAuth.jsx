import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../lib/api.jsx';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        // Verify token with server
        const response = await authAPI.getProfile();
        if (response.data.success) {
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear storage
          logout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (npk, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login(npk, password);
      
      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        // Store in localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal mengubah password';
      return { success: false, message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    changePassword,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

