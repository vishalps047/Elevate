import { useState, useRef, useEffect } from 'react';
import { Mail, CheckCheck, Clock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

export default function EmailPanel({ emails, unreadCount, onMarkRead, onMarkAllRead, onClose }) {
  const [expanded, setExpanded] = useState(null);

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleExpand = (emailId) => {
    if (expanded === emailId) {
      setExpanded(null);
    } else {
      setExpanded(emailId);
      const email = emails.find(e => e.id === emailId);
      if (email && !email.read) onMarkRead(emailId);
    }
  };

  return (
    <div className="absolute top-12 right-0 w-[340px] sm:w-[440px] bg-card rounded-xl shadow-lg border border-border z-50 animate-fade-in" data-testid="email-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <span className="font-heading font-semibold text-foreground text-sm">Emails</span>
          {unreadCount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0 h-5">{unreadCount}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary" onClick={onMarkAllRead}>
          <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
        </Button>
      </div>

      <ScrollArea className="max-h-[450px]">
        {emails.length === 0 ? (
          <div className="py-10 text-center">
            <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No emails yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {emails.map((email) => {
              const isExpanded = expanded === email.id;
              return (
                <div key={email.id} data-testid={`email-${email.id}`}>
                  <button
                    onClick={() => toggleExpand(email.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-fast ${!email.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!email.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Mail className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!email.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {email.subject}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!email.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">From: {email.from_name}</p>
                      {email.cc && email.cc.length > 0 && (
                        <p className="text-xs text-muted-foreground">CC: {email.cc.join(', ')}</p>
                      )}
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{email.preview}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatTime(email.created_at)}</span>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in">
                      <div className="bg-muted/30 rounded-xl p-4 border border-border ml-11">
                        <div className="text-xs text-muted-foreground mb-3 space-y-0.5">
                          <p><span className="font-medium text-foreground/70">From:</span> {email.from_email}</p>
                          <p><span className="font-medium text-foreground/70">To:</span> {email.to_email}</p>
                          {email.cc && email.cc.length > 0 && (
                            <p><span className="font-medium text-foreground/70">CC:</span> {email.cc.join(', ')}</p>
                          )}
                        </div>
                        <div
                          className="text-sm text-foreground/90 leading-relaxed email-body"
                          dangerouslySetInnerHTML={{ __html: email.body }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="px-4 py-2.5 border-t border-border">
        <Button variant="ghost" size="sm" className="w-full text-xs text-primary justify-center h-8" onClick={onClose}>
          Close <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
