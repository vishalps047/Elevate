import { createContext, useContext, useState } from 'react';
import { mockNotifications, mockCoachNotifications, mockUsers } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState('coachee'); // 'coachee' | 'coach' | 'admin'
  const [notifications, setNotifications] = useState(mockNotifications);
  const [coachNotifications, setCoachNotifications] = useState(mockCoachNotifications);
  const [requests, setRequests] = useState(null); // set from pages

  const currentUser = mockUsers[currentRole] || mockUsers.coachee;

  const getNotifications = () => {
    if (currentRole === 'coach') return coachNotifications;
    return notifications;
  };

  const unreadCount = () => getNotifications().filter(n => !n.read).length;

  const markAllRead = () => {
    if (currentRole === 'coach') {
      setCoachNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const markRead = (id) => {
    if (currentRole === 'coach') {
      setCoachNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const addNotification = (notif) => {
    const newNotif = { id: `n${Date.now()}`, ...notif, time: 'just now', read: false };
    if (currentRole === 'coach') {
      setCoachNotifications(prev => [newNotif, ...prev]);
    } else {
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

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
