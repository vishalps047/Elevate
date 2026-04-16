import { useState, useRef, useEffect } from 'react';
import { Bell, Search, LogOut, User, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import NotificationPanel from './NotificationPanel';
import ProfileEditModal from './ProfileEditModal';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const roleNavLinks = {
  coachee: [
    { label: 'Dashboard', path: '/' },
    { label: 'Coaches', path: '/coaches' },
    { label: 'My Sessions', path: '/sessions' },
    { label: 'Help & Support', path: '/help' },
  ],
  coach: [
    { label: 'Dashboard', path: '/coach-dashboard' },
    { label: 'Help & Support', path: '/help' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin-dashboard' },
  ],
};

export default function Navbar() {
  const { user, logout, unreadCount } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = roleNavLinks[user?.role] || roleNavLinks.coachee;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-header shadow-lg">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                const path = user.role === 'coach' ? '/coach-dashboard' : user.role === 'admin' ? '/admin-dashboard' : '/';
                navigate(path);
              }}
            >
              <div className="w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">GT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80 font-sans text-sm font-medium hidden sm:block">Grant Thornton</span>
                <span className="text-white/40 hidden sm:block">|</span>
                <span className="text-white font-heading font-bold text-base tracking-wide">Elevate</span>
              </div>
            </div>
          </div>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-smooth ${
                  isActive(link.path) ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-smooth"
            >
              <Search className="w-4 h-4 text-white" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-9 h-9 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition-smooth"
                data-testid="notification-bell"
              >
                <Bell className="w-4 h-4 text-white" />
                {unreadCount > 0 && (
                  <span className="notif-dot" data-testid="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
            </div>

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 transition-smooth">
                  <Avatar className="w-9 h-9 border-2 border-white/30">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-primary-light text-white text-xs">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{user?.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfile(true)} data-testid="profile-menu-btn"><User className="w-4 h-4 mr-2" /> My Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              className="md:hidden w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-3 pt-1 animate-fade-in">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-smooth ${
                  isActive(link.path) ? 'text-white bg-white/15 rounded-lg' : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {showSearch && (
          <div className="pb-3 animate-fade-in">
            <input
              autoFocus
              type="text"
              placeholder="Search coaches, sessions, resources..."
              className="w-full px-4 py-2 rounded-lg bg-white/15 text-white placeholder:text-white/50 border border-white/20 text-sm focus:outline-none focus:bg-white/20"
              onBlur={() => setShowSearch(false)}
            />
          </div>
        )}
      </div>
      <ProfileEditModal open={showProfile} onClose={() => setShowProfile(false)} />
    </header>
  );
}
