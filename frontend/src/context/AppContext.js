import { createContext, useContext, useState, useEffect } from 'react';
import {
  mockCoacheeNotifications,
  mockCoachNotifications,
  mockAdminNotifications,
  mockUsers
} from '../data/mockData';

const AppContext = createContext();

const STORAGE_KEY = 'elevate_notifications';

// Load from localStorage on startup, fallback to mock data
function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* ignore */ }
  // First load — seed with mock data
  return [
    ...mockCoacheeNotifications,
    ...mockCoachNotifications,
    ...mockAdminNotifications,
  ];
}

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('coachee');

  // ── Single flat store: all notifications for all roles ────────────────────
  // Each notification has a `role` field: 'coachee' | 'coach' | 'admin'
  // localStorage ensures notifications survive React Router navigations.
  const [allNotifications, setAllNotifications] = useState(loadNotifications);

  // Sync to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    } catch (e) { /* ignore */ }
  }, [allNotifications]);

  const currentUser = mockUsers[currentRole] || mockUsers.coachee;

  // ── Return only notifications for the currently active role ──────────────
  const getNotifications = () =>
    allNotifications.filter(n => n.role === currentRole);

  // ── Unread count for the current role ────────────────────────────────────
  const unreadCount = () =>
    allNotifications.filter(n => n.role === currentRole && !n.read).length;

  // ── Mark all read for the current role ───────────────────────────────────
  const markAllRead = () => {
    setAllNotifications(prev =>
      prev.map(n => n.role === currentRole ? { ...n, read: true } : n)
    );
  };

  // ── Mark single notification as read ─────────────────────────────────────
  const markRead = (id) => {
    setAllNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // ── Add notification to ANY role's inbox (one setState call) ──────────────
  // targetRole: 'coachee' | 'coach' | 'admin'
  const addNotificationToRole = (targetRole, notif) => {
    const newNotif = {
      id: `n${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...notif,
      role: targetRole,
      time: 'just now',
      read: false,
    };
    setAllNotifications(prev => [newNotif, ...prev]);
  };

  // ── Add to current role's own inbox ──────────────────────────────────────
  const addNotification = (notif) => addNotificationToRole(currentRole, notif);

  return (
    <AppContext.Provider value={{
      currentRole,
      setCurrentRole,
      currentUser,
      getNotifications,
      unreadCount,
      markAllRead,
      markRead,
      addNotification,
      addNotificationToRole,
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
