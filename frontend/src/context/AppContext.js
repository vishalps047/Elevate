import { createContext, useContext, useState } from 'react';
import {
  mockCoacheeNotifications,
  mockCoachNotifications,
  mockAdminNotifications,
  mockUsers
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('coachee');

  // ── Single flat store: all notifications for all roles in one array ───────
  // Each notification has a `role` field: 'coachee' | 'coach' | 'admin'
  // Using a single setter eliminates all cross-role state update complexity.
  const [allNotifications, setAllNotifications] = useState([
    ...mockCoacheeNotifications,
    ...mockCoachNotifications,
    ...mockAdminNotifications,
  ]);

  const currentUser = mockUsers[currentRole] || mockUsers.coachee;

  // ── Return only notifications for the currently active role ──────────────
  const getNotifications = () =>
    allNotifications.filter(n => n.role === currentRole);

  // ── Unread count for the current role ────────────────────────────────────
  const unreadCount = () =>
    allNotifications.filter(n => n.role === currentRole && !n.read).length;

  // ── Mark all read for current role ───────────────────────────────────────
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

  // ── Add notification to ANY role's inbox (single setState call) ───────────
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

  // ── Convenience: add to current role's own inbox ─────────────────────────
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
