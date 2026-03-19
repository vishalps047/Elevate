import { createContext, useContext, useState } from 'react';
import {
  mockCoacheeNotifications,
  mockCoachNotifications,
  mockAdminNotifications,
  mockUsers
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('coachee'); // 'coachee' | 'coach' | 'admin'

  // ── Separate notification stores per role ──────────────────────────────────
  const [coacheeNotifications, setCoacheeNotifications] = useState(mockCoacheeNotifications);
  const [coachNotifications, setCoachNotifications] = useState(mockCoachNotifications);
  const [adminNotifications, setAdminNotifications] = useState(mockAdminNotifications);

  const currentUser = mockUsers[currentRole] || mockUsers.coachee;

  // ── Return notifications for the CURRENTLY LOGGED-IN role only ─────────────
  const getNotifications = () => {
    if (currentRole === 'coach') return coachNotifications;
    if (currentRole === 'admin') return adminNotifications;
    return coacheeNotifications;
  };

  // ── Unread count for current role ──────────────────────────────────────────
  const unreadCount = () => getNotifications().filter(n => !n.read).length;

  // ── Mark all read for current role ─────────────────────────────────────────
  const markAllRead = () => {
    if (currentRole === 'coach') {
      setCoachNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } else if (currentRole === 'admin') {
      setAdminNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } else {
      setCoacheeNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // ── Mark single notification read for current role ─────────────────────────
  const markRead = (id) => {
    if (currentRole === 'coach') {
      setCoachNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } else if (currentRole === 'admin') {
      setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } else {
      setCoacheeNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  // ── Add notification to a SPECIFIC role's inbox (cross-role dispatch) ──────
  // targetRole: 'coachee' | 'coach' | 'admin'
  const addNotificationToRole = (targetRole, notif) => {
    const newNotif = {
      id: `n${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...notif,
      time: 'just now',
      read: false,
      role: targetRole,
    };
    if (targetRole === 'coach') {
      setCoachNotifications(prev => [newNotif, ...prev]);
    } else if (targetRole === 'admin') {
      setAdminNotifications(prev => [newNotif, ...prev]);
    } else {
      setCoacheeNotifications(prev => [newNotif, ...prev]);
    }
  };

  // ── Convenience: add to current role's own inbox ───────────────────────────
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
      addNotificationToRole, // exposed for cross-role dispatching on reschedule
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
