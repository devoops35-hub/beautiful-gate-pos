import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [token]);

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken,
      });

      if (res.data.success) {
        localStorage.setItem('token', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        return res.data.accessToken;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Clear auth data if refresh fails
      logout();
      throw err;
    }
  };

  /**
   * Login user
   */
  const login = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, formData);
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken);
      setUser(res.data.user);
      toast.success(res.data.message || 'Login successful!');
      return res.data;
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Invalid email or password';
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Register new user
   */
  const register = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, formData);
      localStorage.setItem('token', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.accessToken);
      setRefreshToken(res.data.refreshToken);
      setUser(res.data.user);
      toast.success(res.data.message || 'Registration successful!');
      return res.data;
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      throw err;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Call logout endpoint to revoke refresh token
      if (token) {
        await axios.post(`${API_URL}/api/auth/logout`, {
          refreshToken,
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Continue logout even if request fails
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      delete axios.defaults.headers.common['x-auth-token'];
      delete axios.defaults.headers.common['Authorization'];
      toast.success('You have been logged out');
    }
  };

  /**
   * Logout from all devices
   */
  const logoutAllDevices = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout-all`);
      logout();
      toast.success('Logged out from all devices');
    } catch (err) {
      console.error('Logout all error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to logout from all devices';
      toast.error(errorMsg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        isAuthenticated,
        loading,
        user,
        login,
        register,
        logout,
        logoutAllDevices,
        refreshAccessToken,
        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
