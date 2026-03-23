import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import {
  Calendar, Clock, MapPin, Video, RefreshCw, CheckCircle, ChevronRight
} from 'lucide-react';

export function SessionCard({ session, role, onReschedule }) {
  const isUpcoming = session.status === 'upcoming';
  const otherPerson = role === 'coachee'
    ? { name: session.coach_name, avatar: session.coach_avatar }
    : { name: session.coachee_name, avatar: session.coachee_avatar };

  return (
    <Card className="shadow-card hover:shadow-md transition-smooth" data-testid={`session-${session.id}`}>
      <div className="p-4 flex items-center gap-4">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={otherPerson.avatar} />
          <AvatarFallback>{otherPerson.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{otherPerson.name}</p>
            <Badge className={`text-xs border-0 px-2 ${isUpcoming ? 'bg-accent-subtle text-accent' : 'bg-green-50 text-success'}`}>
              {isUpcoming ? 'Upcoming' : 'Completed'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{session.topic} · Session {session.session_number}/{session.total_sessions}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {session.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.time}</span>
            <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {session.duration}m</span>
          </div>
        </div>
        {isUpcoming && (
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onReschedule(session)} data-testid={`reschedule-btn-${session.id}`}>
              <RefreshCw className="w-3 h-3 mr-1" /> Reschedule
            </Button>
            {session.meeting_link && (
              <Button size="sm" className="bg-primary text-white text-xs h-7 px-3" asChild>
                <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ScheduleModal({ open, onClose, coachName, coachAvatar, onConfirm }) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Fetch availability (using a generic coach endpoint)
      api.getAvailability('any').then(s => setSlots(s)).catch(() => {});
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [open]);

  const dateSlot = slots.find(s => s.date === selectedDate);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    const slot = { date: selectedDate, time: selectedTime, day: dateSlot?.day || selectedDate };
    onConfirm(slot);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Schedule Session</DialogTitle>
        </DialogHeader>
        <div>
          <div className="flex items-center gap-3 mb-4 bg-muted/50 rounded-xl p-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={coachAvatar} />
              <AvatarFallback>{coachName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{coachName}</p>
              <p className="text-xs text-muted-foreground">Select date and time</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Available Dates</p>
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot.date}
                  onClick={() => { setSelectedDate(slot.date); setSelectedTime(null); }}
                  className={`px-3 py-2 rounded-lg border text-xs transition-fast ${
                    selectedDate === slot.date ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted'
                  }`}
                  data-testid={`date-${slot.date}`}
                >
                  {slot.day}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && dateSlot && (
            <div className="mb-4 animate-fade-in">
              <p className="text-sm font-semibold mb-2">Available Times</p>
              <div className="flex flex-wrap gap-2">
                {dateSlot.slots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 rounded-lg border text-xs transition-fast ${
                      selectedTime === time ? 'bg-accent text-white border-accent' : 'bg-card border-border hover:bg-muted'
                    }`}
                    data-testid={`time-${time.replace(/\s/g, '-')}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-primary text-white" onClick={handleConfirm} disabled={!selectedDate || !selectedTime || loading} data-testid="confirm-schedule-btn">
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RescheduleModal({ open, onClose, session, onConfirm }) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    if (open) {
      api.getAvailability('any').then(s => setSlots(s)).catch(() => {});
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [open]);

  const dateSlot = slots.find(s => s.date === selectedDate);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !session) return;
    onConfirm({ date: selectedDate, time: selectedTime }, session);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Reschedule Session</DialogTitle>
        </DialogHeader>
        <div>
          {session && (
            <div className="bg-muted/50 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
              <p>Currently scheduled: <strong className="text-foreground">{session.date} at {session.time}</strong></p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Select New Date</p>
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot.date}
                  onClick={() => { setSelectedDate(slot.date); setSelectedTime(null); }}
                  className={`px-3 py-2 rounded-lg border text-xs transition-fast ${
                    selectedDate === slot.date ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  {slot.day}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && dateSlot && (
            <div className="mb-4 animate-fade-in">
              <p className="text-sm font-semibold mb-2">Select New Time</p>
              <div className="flex flex-wrap gap-2">
                {dateSlot.slots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-3 py-2 rounded-lg border text-xs transition-fast ${
                      selectedTime === time ? 'bg-accent text-white border-accent' : 'bg-card border-border hover:bg-muted'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-primary text-white" onClick={handleConfirm} disabled={!selectedDate || !selectedTime} data-testid="confirm-reschedule-btn">
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
