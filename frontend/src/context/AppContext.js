import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('elevate_token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      api.setToken(token);
      api.getMe()
        .then(u => { setUser(u); setLoading(false); })
        .catch(() => {
          setToken(null);
          api.setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Notification fetch failed:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [token, user, fetchNotifications]);

  const login = async (email, password) => {
    const result = await api.login(email, password);
    api.setToken(result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (_) { /* ignore */ }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('elevate_token');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Mark all read failed:', err);
    }
  };

  const markRead = async (id) => {
    try {
      await api.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.error('Mark read failed:', err);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      logout,
      refreshUser,
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      fetchNotifications,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
