import { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, LogOut, Settings, User, Menu, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import NotificationPanel from './NotificationPanel';
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
    { label: 'My Coaching History', path: '/coach-history' },
    { label: 'My Calendar', path: '/coach-calendar' },
    { label: 'Help & Support', path: '/help' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Coaches', path: '/admin-coaches' },
    { label: 'Coachees', path: '/admin-coachees' },
    { label: 'Reports', path: '/admin-reports' },
  ],
};

export default function Navbar() {
  const { currentRole, setCurrentRole, currentUser, unreadCount } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect role from URL path
  useEffect(() => {
    if (location.pathname.startsWith('/coach-') || location.pathname === '/coach-history' || location.pathname === '/coach-calendar') {
      if (currentRole !== 'coach') setCurrentRole('coach');
    } else if (location.pathname.startsWith('/admin-')) {
      if (currentRole !== 'admin') setCurrentRole('admin');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const navLinks = roleNavLinks[currentRole] || roleNavLinks.coachee;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = (role) => {
    setCurrentRole(role);
    const defaultPath = role === 'coach' ? '/coach-dashboard' : role === 'admin' ? '/admin-dashboard' : '/';
    navigate(defaultPath);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-header shadow-lg">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                const path = currentRole === 'coach' ? '/coach-dashboard' : currentRole === 'admin' ? '/admin-dashboard' : '/';
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
                  isActive(link.path)
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-smooth"
            >
              <Search className="w-4 h-4 text-white" />
            </button>

            {/* Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-warning/80 hover:bg-warning flex items-center justify-center transition-smooth">
                  <span className="text-white font-bold text-xs">
                    {currentRole === 'coachee' ? 'CE' : currentRole === 'coach' ? 'CO' : 'AD'}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role (Demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleSwitch('coachee')} className={currentRole === 'coachee' ? 'font-semibold text-primary' : ''}>
                  Coachee View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleSwitch('coach')} className={currentRole === 'coach' ? 'font-semibold text-primary' : ''}>
                  Coach View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleSwitch('admin')} className={currentRole === 'admin' ? 'font-semibold text-primary' : ''}>
                  Admin View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative w-9 h-9 rounded-full bg-accent/80 hover:bg-accent flex items-center justify-center transition-smooth"
              >
                <Bell className="w-4 h-4 text-white" />
                {unreadCount() > 0 && (
                  <span className="notif-dot">{unreadCount() > 9 ? '9+' : unreadCount()}</span>
                )}
              </button>
              {showNotif && (
                <NotificationPanel onClose={() => setShowNotif(false)} />
              )}
            </div>

            {/* Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 transition-smooth">
                  <Avatar className="w-9 h-9 border-2 border-white/30">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback className="bg-primary-light text-white text-xs">
                      {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{currentUser?.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{currentRole}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem><User className="w-4 h-4 mr-2" /> My Profile</DropdownMenuItem>
                <DropdownMenuItem><Settings className="w-4 h-4 mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive"><LogOut className="w-4 h-4 mr-2" /> Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <button
              className="md:hidden w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 pt-1 animate-fade-in">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-smooth ${
                  isActive(link.path)
                    ? 'text-white bg-white/15 rounded-lg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Search Bar overlay */}
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
    </header>
  );
}
