import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Video, RefreshCw, CheckCircle, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

export function SessionCard({ session, role, onReschedule, onComplete }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const isUpcoming = session.status === 'upcoming';
  const isCompleted = session.status === 'completed';
  const otherPerson = role === 'coachee'
    ? { name: session.coach_name, avatar: session.coach_avatar }
    : { name: session.coachee_name, avatar: session.coachee_avatar };

  const toggleNotes = async () => {
    if (!showNotes) {
      setLoadingNotes(true);
      try {
        const data = await api.getSessionNotes(session.id);
        setNotes(data);
      } catch { setNotes([]); }
      setLoadingNotes(false);
    }
    setShowNotes(!showNotes);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const note = await api.addSessionNote(session.id, newNote.trim());
      setNotes([note, ...notes]);
      setNewNote('');
    } catch (e) {
      // toast error handled by caller
    }
    setSubmittingNote(false);
  };

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
        <div className="flex gap-2 flex-shrink-0">
          {isUpcoming && (
            <>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => onReschedule(session)} data-testid={`reschedule-btn-${session.id}`}>
                <RefreshCw className="w-3 h-3 mr-1" /> Reschedule
              </Button>
              {onComplete && (
                <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-success border-success/30 hover:bg-success/10" onClick={() => onComplete(session)} data-testid={`complete-btn-${session.id}`}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Complete
                </Button>
              )}
              {session.meeting_link && (
                <Button size="sm" className="bg-primary text-white text-xs h-7 px-3" asChild>
                  <a href={session.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                </Button>
              )}
            </>
          )}
          {isCompleted && (
            <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-muted-foreground" onClick={toggleNotes} data-testid={`notes-toggle-${session.id}`}>
              <MessageSquare className="w-3 h-3 mr-1" /> Notes
              {showNotes ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Notes Section */}
      {showNotes && isCompleted && (
        <div className="border-t border-border px-4 py-3 bg-muted/20" data-testid={`notes-section-${session.id}`}>
          {/* Add Note */}
          <div className="flex gap-2 mb-3">
            <input
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Add a note about this session..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              data-testid={`note-input-${session.id}`}
            />
            <Button size="sm" className="text-xs h-8 px-3 bg-primary text-white" onClick={handleAddNote} disabled={submittingNote || !newNote.trim()} data-testid={`add-note-btn-${session.id}`}>
              <Send className="w-3 h-3" />
            </Button>
          </div>
          {/* Notes List */}
          {loadingNotes ? (
            <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No notes yet. Add your reflections from this session.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notes.map(note => (
                <div key={note.id} className="bg-background rounded-lg p-2.5 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">{note.user_name}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{note.user_role}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function ScheduleModal({ open, onClose, coachId, coachName, coachAvatar, onConfirm }) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open && coachId) {
      setFetching(true);
      setSelectedDate(null);
      setSelectedTime(null);
      api.getAvailability(coachId)
        .then(s => {
          // Filter out past dates
          const today = new Date().toISOString().split('T')[0];
          setSlots(s.filter(slot => slot.date >= today));
        })
        .catch(() => setSlots([]))
        .finally(() => setFetching(false));
    }
  }, [open, coachId]);

  const dateSlot = slots.find(s => s.date === selectedDate);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      await onConfirm({ date: selectedDate, time: selectedTime, day: dateSlot?.day || selectedDate });
      onClose();
    } catch (e) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
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
              <p className="text-xs text-muted-foreground">Select from available dates & times</p>
            </div>
          </div>

          {fetching ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Loading availability...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No available slots. Ask your coach to update their calendar.</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Available Dates</p>
                <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {slots.map(slot => (
                    <button
                      key={slot.date}
                      onClick={() => { setSelectedDate(slot.date); setSelectedTime(null); }}
                      className={`px-3 py-2 rounded-lg border text-xs transition-fast ${
                        selectedDate === slot.date ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted'
                      }`}
                      data-testid={`date-${slot.date}`}
                    >
                      <div className="font-medium">{slot.day}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{slot.slots.length} slots</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && dateSlot && (
                <div className="mb-4 animate-fade-in">
                  <p className="text-sm font-semibold mb-2">Available Times for {dateSlot.day}</p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlot.slots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-2 rounded-lg border text-xs transition-fast ${
                          selectedTime === time ? 'bg-accent text-white border-accent' : 'bg-card border-border hover:bg-muted'
                        }`}
                        data-testid={`time-${time.replace(/\s/g, '-')}`}
                      >
                        <Clock className="w-3 h-3 inline mr-1" />{time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
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

export function RescheduleModal({ open, onClose, session, coachId, onConfirm }) {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    if (open) {
      const cId = coachId || session?.coach_id;
      if (cId) {
        api.getAvailability(cId).then(s => {
          const today = new Date().toISOString().split('T')[0];
          setSlots(s.filter(slot => slot.date >= today));
        }).catch(() => setSlots([]));
      }
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [open, coachId, session]);

  const dateSlot = slots.find(s => s.date === selectedDate);

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !session) return;
    onConfirm({ date: selectedDate, time: selectedTime }, session);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Reschedule Session</DialogTitle>
        </DialogHeader>
        <div>
          {session && (
            <div className="bg-muted/50 rounded-xl p-3 mb-4 text-xs text-muted-foreground">
              <p>Currently: <strong className="text-foreground">{session.date} at {session.time}</strong></p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Select New Date</p>
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
              {slots.map(slot => (
                <button
                  key={slot.date}
                  onClick={() => { setSelectedDate(slot.date); setSelectedTime(null); }}
                  className={`px-3 py-2 rounded-lg border text-xs transition-fast ${
                    selectedDate === slot.date ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{slot.day}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">{slot.slots.length} slots</div>
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
                    className={`px-4 py-2 rounded-lg border text-xs transition-fast ${
                      selectedTime === time ? 'bg-accent text-white border-accent' : 'bg-card border-border hover:bg-muted'
                    }`}
                  >
                    <Clock className="w-3 h-3 inline mr-1" />{time}
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
