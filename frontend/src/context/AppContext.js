import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('elevate_token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [emails, setEmails] = useState([]);

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
    } catch (_) { /* ignore */ }
  }, [token]);

  const fetchEmails = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.getEmails();
      setEmails(data);
    } catch (_) { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (token && user) {
      fetchNotifications();
      fetchEmails();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchEmails();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [token, user, fetchNotifications, fetchEmails]);

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
    setEmails([]);
    localStorage.removeItem('elevate_token');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadEmailCount = emails.filter(e => !e.read).length;

  const markAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (_) { /* ignore */ }
  };

  const markRead = async (id) => {
    try {
      await api.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (_) { /* ignore */ }
  };

  const markEmailRead = async (id) => {
    try {
      await api.markEmailRead(id);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
    } catch (_) { /* ignore */ }
  };

  const markAllEmailsRead = async () => {
    try {
      await api.markAllEmailsRead();
      setEmails(prev => prev.map(e => ({ ...e, read: true })));
    } catch (_) { /* ignore */ }
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
      emails,
      unreadEmailCount,
      markEmailRead,
      markAllEmailsRead,
      fetchEmails,
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
