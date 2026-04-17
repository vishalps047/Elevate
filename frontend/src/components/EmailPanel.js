import { useState } from 'react';
import { Mail, CheckCheck, Clock, ChevronRight, X, Paperclip, Reply, Forward, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent } from './ui/dialog';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatShort(isoStr) {
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
}

function EmailViewDialog({ email, open, onClose }) {
  if (!email) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden" data-testid="email-view-dialog">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">{email.subject}</p>
              <p className="text-xs text-muted-foreground">{formatDate(email.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-1 px-5 py-2 border-b border-border">
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground">
            <Reply className="w-3.5 h-3.5" /> Reply
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground">
            <Forward className="w-3.5 h-3.5" /> Forward
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Sender info */}
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">ET</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-foreground">{email.from_name}</p>
                <span className="text-xs text-muted-foreground">&lt;{email.from_email}&gt;</span>
              </div>
              <p className="text-xs text-muted-foreground">
                To: <span className="text-foreground/70">{email.to_email}</span>
              </p>
              {email.cc && email.cc.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  CC: <span className="text-foreground/70">{email.cc.join('; ')}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Email body */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="px-5 py-4">
            <div
              className="text-sm text-foreground/90 leading-relaxed email-body"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Paperclip className="w-3 h-3" />
            <span>No attachments</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Elevate@in.gt.com</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EmailPanel({ emails, unreadCount, onMarkRead, onMarkAllRead, onClose }) {
  const [selectedEmail, setSelectedEmail] = useState(null);

  const openEmail = (email) => {
    setSelectedEmail(email);
    if (!email.read) onMarkRead(email.id);
  };

  return (
    <>
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
              {emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => openEmail(email)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-fast ${!email.read ? 'bg-primary/5' : ''}`}
                  data-testid={`email-${email.id}`}
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
                      {!email.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">From: {email.from_name}</p>
                    {email.cc && email.cc.length > 0 && (
                      <p className="text-xs text-muted-foreground">CC: {email.cc.join(', ')}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{email.preview}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatShort(email.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-2 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2.5 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-xs text-primary justify-center h-8" onClick={onClose}>
            Close <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      <EmailViewDialog
        email={selectedEmail}
        open={!!selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />
    </>
  );
}
