import { useState } from 'react';
import { Calendar, Clock, Video, ChevronRight, CheckCircle, Edit2, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { availabilitySlots } from '../data/mockData';

const statusConfig = {
  upcoming: { label: 'Upcoming', className: 'status-pending', icon: Clock },
  completed: { label: 'Completed', className: 'status-completed', icon: CheckCircle },
  cancelled: { label: 'Cancelled', className: 'status-declined', icon: X },
};

// ─── SessionCard ────────────────────────────────────────────────────────────
export function SessionCard({ session, role = 'coachee', onFeedback, onReschedule }) {
  const config = statusConfig[session.status] || statusConfig.upcoming;
  const Icon = config.icon;
  const displayName = role === 'coachee' ? session.coachName : session.coacheeName;
  const displayAvatar = role === 'coachee' ? session.coachAvatar : session.coacheeAvatar;
  const displayRole = role === 'coachee' ? 'Coach' : session.coacheeRole || 'Coachee';

  return (
    <Card className="shadow-card hover:shadow-md transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback className="bg-primary text-white text-sm">
                {displayName?.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-heading font-semibold text-sm text-foreground">{displayName}</h4>
                <span className="text-xs text-muted-foreground">{displayRole}</span>
              </div>
              <p className="text-sm text-foreground/80 mt-0.5">{session.topic}</p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">{session.date}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">{session.time} · {session.duration} min</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span className="text-xs">Session {session.sessionNumber}/{session.totalSessions}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${config.className}`}>
              <Icon className="w-3 h-3" /> {config.label}
            </span>
          </div>
        </div>

        {/* Upcoming actions */}
        {session.status === 'upcoming' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white h-8 text-xs px-3"
              onClick={() => window.open(session.meetingLink || '#', '_blank')}
            >
              <Video className="w-3.5 h-3.5 mr-1.5" /> Join Session
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs px-3"
              onClick={() => onReschedule && onReschedule(session)}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Reschedule
            </Button>
          </div>
        )}

        {/* Completed — pending feedback */}
        {session.status === 'completed' && !session.feedbackSubmitted && role === 'coachee' && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-warning bg-yellow-50 rounded-lg p-2.5 mb-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-medium">Please submit feedback to proceed to your next session</p>
            </div>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white h-8 text-xs px-3"
              onClick={() => onFeedback && onFeedback(session)}
            >
              Submit Feedback <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}

        {/* Completed — feedback done */}
        {session.status === 'completed' && session.feedbackSubmitted && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            <span className="text-xs text-success font-medium">Feedback submitted · {session.rating} ★</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── RescheduleModal ─────────────────────────────────────────────────────────
// Props:
//   open, onClose, session
//   initiatorRole : 'coachee' | 'coach'   (who is rescheduling)
//   onConfirm(slot, session)              (update the session in parent state)
//   addNotificationToRole(role, notif)    (from AppContext — to fire cross-role notifs)
export function RescheduleModal({ open, onClose, session, initiatorRole = 'coachee', onConfirm, addNotificationToRole }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSaving(false);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time slot');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      // Update session in parent
      onConfirm({ date: selectedDate, time: selectedTime }, session);

      // ── Fire cross-role notifications ────────────────────────────────
      const topic = session?.topic || 'Coaching Session';
      const sessionNum = session?.sessionNumber || '';

      if (initiatorRole === 'coachee') {
        // Coachee rescheduled → notify Coach + Admin
        addNotificationToRole('coach', {
          type: 'reschedule',
          title: 'Session Rescheduled by Coachee',
          message: `Sarah Johnson has rescheduled Session ${sessionNum} (${topic}) to ${selectedDate} at ${selectedTime}.`,
          avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
        });
        addNotificationToRole('admin', {
          type: 'reschedule',
          title: 'Session Rescheduled',
          message: `Sarah Johnson rescheduled Session ${sessionNum} with Fatema Hunaid to ${selectedDate} at ${selectedTime}.`,
          avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
        });
        toast.success('Session rescheduled!', {
          description: `New slot: ${selectedDate} at ${selectedTime}. Coach has been notified.`,
        });
      } else {
        // Coach rescheduled → notify Coachee + Admin
        addNotificationToRole('coachee', {
          type: 'reschedule',
          title: 'Session Rescheduled by Your Coach',
          message: `Fatema Hunaid has rescheduled your Session ${sessionNum} (${topic}) to ${selectedDate} at ${selectedTime}.`,
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        });
        addNotificationToRole('admin', {
          type: 'reschedule',
          title: 'Session Rescheduled',
          message: `Fatema Hunaid rescheduled Session ${sessionNum} with Sarah Johnson to ${selectedDate} at ${selectedTime}.`,
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        });
        toast.success('Session rescheduled!', {
          description: `New slot: ${selectedDate} at ${selectedTime}. Coachee & Admin have been notified.`,
        });
      }

      reset();
      onClose();
    }, 900);
  };

  const handleClose = () => { reset(); onClose(); };

  const displayName = initiatorRole === 'coachee' ? session?.coachName : session?.coacheeName;
  const displayAvatar = initiatorRole === 'coachee' ? session?.coachAvatar : session?.coacheeAvatar;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" /> Reschedule Session
          </DialogTitle>
        </DialogHeader>

        {/* Session info */}
        {session && (
          <div className="flex items-center gap-3 p-3 bg-primary-subtle rounded-xl mb-1">
            <Avatar className="w-10 h-10">
              <AvatarImage src={displayAvatar} />
              <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{session.topic}</p>
              <p className="text-xs text-muted-foreground">with {displayName} · Currently: {session.date} at {session.time}</p>
            </div>
          </div>
        )}

        {/* Who gets notified */}
        <div className="flex items-start gap-2 bg-accent-subtle border border-accent/20 rounded-xl px-3 py-2.5 mb-2">
          <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80">
            {initiatorRole === 'coachee'
              ? 'Your coach (Fatema Hunaid) and the Admin will be notified of this reschedule.'
              : 'The coachee (Sarah Johnson) and the Admin will be notified of this reschedule.'}
          </p>
        </div>

        <p className="text-sm font-semibold text-foreground mb-3">Pick a New Slot</p>
        <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
          {availabilitySlots.map((daySlot) => (
            <div key={daySlot.date}>
              <button
                onClick={() => { setSelectedDate(daySlot.day); setSelectedTime(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-fast ${
                  selectedDate === daySlot.day
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-primary-subtle text-foreground'
                }`}
              >
                {daySlot.day}
              </button>
              {selectedDate === daySlot.day && (
                <div className="flex flex-wrap gap-2 mt-2 ml-2 animate-fade-in">
                  {daySlot.slots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-fast ${
                        selectedTime === t
                          ? 'bg-accent text-white border-accent'
                          : 'bg-card border-border text-foreground hover:border-accent hover:text-accent'
                      }`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || saving}
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" /> Confirm Reschedule</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── ScheduleModal (new booking, not reschedule) ─────────────────────────────
export function ScheduleModal({ open, onClose, coachName, coachAvatar, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }
    onConfirm({ date: selectedDate, time: selectedTime });
    toast.success('Session scheduled successfully!', {
      description: `Your session is booked for ${selectedDate} at ${selectedTime}`,
    });
    setSelectedDate(null);
    setSelectedTime(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Schedule a Session
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 bg-primary-subtle rounded-xl mb-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={coachAvatar} />
            <AvatarFallback>{coachName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{coachName}</p>
            <p className="text-xs text-muted-foreground">Choose from available slots</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-foreground mb-3">Available Slots</p>
        <div className="space-y-3 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
          {availabilitySlots.map((daySlot) => (
            <div key={daySlot.date}>
              <button
                onClick={() => { setSelectedDate(daySlot.day); setSelectedTime(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-fast ${
                  selectedDate === daySlot.day
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-primary-subtle text-foreground'
                }`}
              >
                {daySlot.day}
              </button>
              {selectedDate === daySlot.day && (
                <div className="flex flex-wrap gap-2 mt-2 ml-2 animate-fade-in">
                  {daySlot.slots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-fast ${
                        selectedTime === t
                          ? 'bg-accent text-white border-accent'
                          : 'bg-card border-border text-foreground hover:border-accent hover:text-accent'
                      }`}
                    >
                      <Clock className="w-3 h-3 inline mr-1" />{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-white"
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
          >
            Confirm Booking <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── FeedbackModal ────────────────────────────────────────────────────────────
export function FeedbackModal({ open, onClose, session, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ rating, comment });
      toast.success('Feedback submitted! Thank you.');
      onClose();
      setSubmitting(false);
      setRating(0);
      setComment('');
    }, 1000);
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Session Feedback</DialogTitle>
        </DialogHeader>

        {session && (
          <div className="p-3 bg-muted rounded-xl mb-4">
            <p className="text-sm font-medium text-foreground">{session.topic}</p>
            <p className="text-xs text-muted-foreground mt-1">{session.date} · {session.time}</p>
          </div>
        )}

        <div className="mb-5">
          <label className="text-sm font-semibold mb-3 block">How was your session?</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="transition-fast"
              >
                <svg
                  className={`w-9 h-9 transition-fast ${
                    star <= (hoveredStar || rating)
                      ? 'fill-warning text-warning scale-110'
                      : 'fill-muted text-muted-foreground'
                  }`}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
            {(hoveredStar || rating) > 0 && (
              <span className="text-sm font-medium text-warning ml-1">{ratingLabels[hoveredStar || rating]}</span>
            )}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-sm font-semibold mb-2 block">Additional Comments (optional)</label>
          <textarea
            className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm resize-none min-h-[90px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Share your thoughts about this session..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
