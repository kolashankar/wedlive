'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext({});

// JWT token decoder (without verification - client-side check only)
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token) {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  // Check if token expires in less than 5 minutes (grace period)
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (expiryTime - now) < fiveMinutes;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Validate token before using it
    if (savedToken && userData) {
      if (isTokenExpired(savedToken)) {
        console.warn('⚠️ JWT token expired - clearing auth state');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } else {
        setToken(savedToken);
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name) => {
    const response = await api.post('/api/auth/register', { email, password, full_name });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails due to auth error, logout
      if (error.response?.status === 401) {
        console.error('❌ Token invalid - logging out');
        logout();
      }
      return null;
    }
  };

  // Check token validity periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenValidity = () => {
      if (isTokenExpired(token)) {
        console.warn('⚠️ JWT token expired - logging out');
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkTokenValidity, 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      setToken, 
      setUser, 
      login, 
      register, 
      logout, 
      refreshUser, 
      loading,
      isTokenExpired: () => isTokenExpired(token)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
