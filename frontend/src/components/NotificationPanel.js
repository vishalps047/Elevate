import { useState } from 'react';
import { Bell, CheckCheck, Clock, Calendar, MessageSquare, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { useApp } from '../context/AppContext';

const typeIcons = {
  request: { icon: MessageSquare, color: 'text-primary-light bg-primary-subtle' },
  session: { icon: Calendar, color: 'text-accent bg-accent-subtle' },
  feedback: { icon: AlertCircle, color: 'text-warning bg-yellow-50' },
  system: { icon: Bell, color: 'text-success bg-green-50' },
};

export default function NotificationPanel({ onClose }) {
  const { getNotifications, markAllRead, markRead, unreadCount } = useApp();
  const notifs = getNotifications();

  return (
    <div className="absolute top-12 right-0 w-80 sm:w-96 bg-card rounded-xl shadow-lg border border-border z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-heading font-semibold text-foreground text-sm">Notifications</span>
          {unreadCount() > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0 h-5">
              {unreadCount()}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2 text-primary hover:text-primary"
          onClick={markAllRead}
        >
          <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
        </Button>
      </div>

      {/* Notifications List */}
      <ScrollArea className="max-h-[400px]">
        {notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifs.map((notif) => {
              const typeConfig = typeIcons[notif.type] || typeIcons.system;
              const IconComponent = typeConfig.icon;
              return (
                <button
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-fast ${
                    !notif.read ? 'bg-primary-subtle/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {notif.avatar ? (
                      <div className="relative">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={notif.avatar} />
                          <AvatarFallback>{notif.title[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${typeConfig.color}`}>
                          <IconComponent className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    ) : (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${typeConfig.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm ${!notif.read ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{notif.time}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full text-xs text-primary justify-center h-8">
          View all notifications <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
