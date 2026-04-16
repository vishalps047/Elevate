import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import {
  Users, Calendar, TrendingUp, ChevronRight, CheckCircle,
  Clock, XCircle, MessageSquare, Plus, Trash2, Edit2, Save, X
} from 'lucide-react';
import { SessionCard, ScheduleModal, RescheduleModal } from '../components/SessionComponents';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

const TIME_OPTIONS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

function StatCard({ icon: Icon, value, label, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-subtle text-primary', accent: 'bg-accent-subtle text-accent',
    warning: 'bg-yellow-50 text-warning', success: 'bg-green-50 text-success',
  };
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground/80 mt-0.5">{label}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AvailabilityCalendar({ user }) {
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth()); });
  const [saving, setSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    try {
      const data = await api.getRawAvailability(user.id);
      setAvailability(data);
    } catch (e) {
      toast.error('Failed to load availability');
    }
  }, [user.id]);

  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];
    const startPad = first.getDay();
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDateStr = (d) => d?.toISOString().split('T')[0];
  const getDayLabel = (d) => d?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' });

  const dateAvail = (dateStr) => availability.find(a => a.date === dateStr);

  const handleDateClick = (d) => {
    if (!d || d.getDay() === 0 || d.getDay() === 6) return;
    const ds = getDateStr(d);
    setSelectedDate(ds);
    const existing = dateAvail(ds);
    setSelectedSlots(existing?.slots || []);
  };

  const toggleSlot = (time) => {
    setSelectedSlots(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]);
  };

  const saveSlots = async () => {
    if (!selectedDate) return;
    setSaving(true);
    try {
      if (selectedSlots.length === 0) {
        await api.removeAvailability(selectedDate);
        toast.success('Availability removed for this date');
      } else {
        const d = new Date(selectedDate + 'T00:00:00');
        await api.setAvailability({
          date: selectedDate,
          day_label: getDayLabel(d),
          slots: selectedSlots.sort(),
        });
        toast.success('Availability saved!');
      }
      await loadAvailability();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeDate = async (dateStr) => {
    try {
      await api.removeAvailability(dateStr);
      toast.success('Date removed');
      if (selectedDate === dateStr) { setSelectedDate(null); setSelectedSlots([]); }
      await loadAvailability();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const now = new Date();
    if (prev.getFullYear() > now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() >= now.getMonth())) {
      setCurrentMonth(prev);
    }
  };
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const canGoPrev = (() => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    const now = new Date();
    return prev.getFullYear() > now.getFullYear() || (prev.getFullYear() === now.getFullYear() && prev.getMonth() >= now.getMonth());
  })();

  return (
    <Card className="shadow-card" data-testid="availability-calendar">
      <CardContent className="p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Manage Availability
        </h3>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" size="sm" onClick={prevMonth} disabled={!canGoPrev} className="h-7 px-2 text-xs">&lt; Prev</Button>
          <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 px-2 text-xs">Next &gt;</Button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
          ))}
          {days.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} />;
            const ds = getDateStr(d);
            const avail = dateAvail(ds);
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const isSelected = selectedDate === ds;
            const hasSlots = avail && avail.slots.length > 0;
            const bookedCount = avail?.booked_slots?.length || 0;
            const today = new Date(); today.setHours(0,0,0,0);
            const isPast = d < today;
            const isDisabled = isWeekend || isPast;

            return (
              <button
                key={ds}
                onClick={() => handleDateClick(d)}
                disabled={isDisabled}
                className={`relative h-9 w-full rounded-lg text-xs font-medium transition-fast ${
                  isDisabled ? 'text-muted-foreground/30 cursor-not-allowed' :
                  isSelected ? 'bg-primary text-white ring-2 ring-primary/30' :
                  hasSlots ? 'bg-accent-subtle text-accent hover:bg-accent/20 border border-accent/30' :
                  'hover:bg-muted text-foreground'
                }`}
              >
                {d.getDate()}
                {hasSlots && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
                {bookedCount > 0 && (
                  <span className="absolute top-0 right-0.5 text-[8px] text-warning font-bold">{bookedCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Time slot picker */}
        {selectedDate && (
          <div className="animate-fade-in border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">
                Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" onClick={() => { setSelectedDate(null); setSelectedSlots([]); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {TIME_OPTIONS.map(time => {
                const isBooked = dateAvail(selectedDate)?.booked_slots?.includes(time);
                const isActive = selectedSlots.includes(time);
                return (
                  <button
                    key={time}
                    onClick={() => !isBooked && toggleSlot(time)}
                    disabled={isBooked}
                    className={`px-2.5 py-1.5 rounded-lg text-xs border transition-fast ${
                      isBooked ? 'bg-destructive/10 border-destructive/20 text-destructive line-through cursor-not-allowed' :
                      isActive ? 'bg-accent text-white border-accent' :
                      'bg-card border-border hover:bg-muted text-foreground'
                    }`}
                  >
                    {time} {isBooked && '(Booked)'}
                  </button>
                );
              })}
            </div>
            <Button size="sm" className="bg-primary text-white text-xs h-8 w-full" onClick={saveSlots} disabled={saving} data-testid="save-availability-btn">
              {saving ? 'Saving...' : <><Save className="w-3 h-3 mr-1" /> Save Availability</>}
            </Button>
          </div>
        )}

        {/* Upcoming available dates summary */}
        {!selectedDate && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-2">Available dates this month:</p>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {availability
                .filter(a => {
                  const today = new Date().toISOString().split('T')[0];
                  return a.date >= today && a.date.startsWith(currentMonth.toISOString().slice(0, 7)) && a.slots.length > 0;
                })
                .slice(0, 8)
                .map(a => (
                  <div key={a.date} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-2.5 py-1.5">
                    <span className="text-foreground">{a.day_label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{a.slots.length - (a.booked_slots?.length || 0)} free / {a.slots.length} slots</span>
                      <button onClick={() => removeDate(a.date)} className="text-destructive/50 hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CoachDashboard() {
  const { user, fetchNotifications } = useApp();
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, request: null, action: null });
  const [processing, setProcessing] = useState(false);
  const [scheduleModal, setScheduleModal] = useState({ open: false, request: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });
  const [editSessionsModal, setEditSessionsModal] = useState({ open: false, request: null, value: 6 });

  const loadData = async () => {
    try {
      const [reqRes, sessRes] = await Promise.all([api.getRequests(), api.getSessions()]);
      setRequests(reqRes);
      setSessions(sessRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const pendingRequests = requests.filter(r => {
    if (r.status !== 'pending') return false;
    const idx = r.current_preference_index;
    const pref = r.preferences?.[idx];
    return pref?.coach_id === user?.id && pref?.status === 'pending';
  });

  const activeJourneys = requests.filter(r => (r.status === 'accepted' || r.status === 'paused') && r.active_coach_id === user?.id);
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const handleAccept = async () => {
    if (!actionModal.request) return;
    setProcessing(true);
    try {
      await api.acceptRequest(actionModal.request.id);
      toast.success(`You accepted ${actionModal.request.coachee_name}'s coaching request!`);
      setActionModal({ open: false, request: null, action: null });
      await loadData();
      fetchNotifications();
    } catch (e) { toast.error(e.message); } finally { setProcessing(false); }
  };

  const handleDecline = async () => {
    if (!actionModal.request) return;
    setProcessing(true);
    try {
      await api.declineRequest(actionModal.request.id);
      toast.info('Request declined.');
      setActionModal({ open: false, request: null, action: null });
      await loadData();
      fetchNotifications();
    } catch (e) { toast.error(e.message); } finally { setProcessing(false); }
  };

  const handleUpdateSessions = async () => {
    if (!editSessionsModal.request) return;
    try {
      await api.updateTotalSessions(editSessionsModal.request.id, editSessionsModal.value);
      toast.success(`Total sessions updated to ${editSessionsModal.value}`);
      setEditSessionsModal({ open: false, request: null, value: 6 });
      await loadData();
    } catch (e) { toast.error(e.message); }
  };

  const handlePauseJourney = async (journeyId) => {
    try {
      await api.pauseJourney(journeyId);
      toast.success('Journey paused. Coachee has been notified.');
      await loadData();
      fetchNotifications();
    } catch (e) { toast.error(e.message); }
  };

  const handleRestartJourney = async (journeyId) => {
    try {
      await api.restartJourney(journeyId);
      toast.success('Journey resumed! Coachee has been notified.');
      await loadData();
      fetchNotifications();
    } catch (e) { toast.error(e.message); }
  };

  const handleScheduleConfirm = async (slot) => {
    try {
      await api.createSession({ request_id: scheduleModal.request.id, date: slot.date, time: slot.time });
      toast.success('Session scheduled!');
      setScheduleModal({ open: false, request: null });
      await loadData();
      fetchNotifications();
    } catch (e) { toast.error(e.message); }
  };

  const handleRescheduleConfirm = async (slot, session) => {
    try {
      await api.rescheduleSession(session.id, { date: slot.date, time: slot.time });
      toast.success('Session rescheduled!');
      setRescheduleModal({ open: false, session: null });
      await loadData();
      fetchNotifications();
    } catch (e) { toast.error(e.message); }
  };

  const handleCompleteSession = async (session) => {
    try {
      await api.completeSession(session.id);
      toast.success(`Session marked as completed`);
      await loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary px-6 lg:px-10 py-6">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">
          <Avatar className="w-14 h-14 border-3 border-white/30">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-primary-light text-white">{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-heading font-semibold text-white" data-testid="coach-welcome">{user?.name}</h3>
            <p className="text-white/70 text-xs">{user?.title} · {user?.location}</p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={MessageSquare} value={pendingRequests.length} label="Pending Requests" color="warning" />
          <StatCard icon={Users} value={activeJourneys.length} label="Active Coachees" color="primary" />
          <StatCard icon={Calendar} value={upcomingSessions.length} label="Upcoming Sessions" color="accent" />
          <StatCard icon={TrendingUp} value={sessions.filter(s => s.status === 'completed').length} label="Sessions Completed" color="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Requests */}
            <Card className="shadow-card" data-testid="pending-requests-section">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-foreground">Pending Requests</h3>
                  {pendingRequests.length > 0 && <Badge className="bg-warning/10 text-warning border-0">{pendingRequests.length} new</Badge>}
                </div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map(req => {
                      const profile = req.coachee_profile || {};
                      return (
                        <div key={req.id} className="bg-muted/50 rounded-xl p-4 border border-border" data-testid={`request-${req.id}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={req.coachee_avatar} />
                              <AvatarFallback>{req.coachee_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{req.coachee_name}</p>
                              <p className="text-xs text-muted-foreground">{req.coachee_role} · {req.mentorship_area}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button size="sm" className="bg-primary text-white text-xs h-8" onClick={() => setActionModal({ open: true, request: req, action: 'accept' })} data-testid={`accept-btn-${req.id}`}>
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-8 text-destructive border-destructive/30" onClick={() => setActionModal({ open: true, request: req, action: 'decline' })} data-testid={`decline-btn-${req.id}`}>
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                              </Button>
                            </div>
                          </div>
                          {/* Coachee Profile Details */}
                          {(profile.tier || profile.designation || profile.business_unit) && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2 text-xs">
                              {profile.tier && <div className="bg-background rounded-lg px-2 py-1.5 border border-border"><span className="text-muted-foreground">Tier: </span><span className="font-medium text-foreground">{profile.tier}</span></div>}
                              {profile.designation && <div className="bg-background rounded-lg px-2 py-1.5 border border-border"><span className="text-muted-foreground">Designation: </span><span className="font-medium text-foreground">{profile.designation}</span></div>}
                              {profile.location && <div className="bg-background rounded-lg px-2 py-1.5 border border-border"><span className="text-muted-foreground">Location: </span><span className="font-medium text-foreground">{profile.location}</span></div>}
                              {profile.business_unit && <div className="bg-background rounded-lg px-2 py-1.5 border border-border"><span className="text-muted-foreground">BU: </span><span className="font-medium text-foreground">{profile.business_unit}</span></div>}
                              {profile.competency && <div className="bg-background rounded-lg px-2 py-1.5 border border-border"><span className="text-muted-foreground">Competency: </span><span className="font-medium text-foreground">{profile.competency}</span></div>}
                              {profile.enrolment_type && <div className="bg-background rounded-lg px-2 py-1.5 border border-border"><span className="text-muted-foreground">Enrolment: </span><span className="font-medium text-foreground">{profile.enrolment_type}</span></div>}
                            </div>
                          )}
                          {req.goals && <p className="text-xs text-muted-foreground line-clamp-2"><span className="font-medium text-foreground">Goals: </span>{req.goals}</p>}
                          {profile.reason_for_enrolment && <p className="text-xs text-muted-foreground mt-1 line-clamp-2"><span className="font-medium text-foreground">Reason: </span>{profile.reason_for_enrolment}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Upcoming Sessions</h3>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map(s => (
                      <SessionCard key={s.id} session={s} role="coach" onReschedule={(s) => setRescheduleModal({ open: true, session: s })} onComplete={handleCompleteSession} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Active Coachees with edit total sessions */}
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Active Coachees</h3>
                {activeJourneys.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active coachees</p>
                ) : (
                  <div className="space-y-3">
                    {activeJourneys.map(journey => {
                      const journeySessions = sessions.filter(s => s.request_id === journey.id);
                      const completed = journeySessions.filter(s => s.status === 'completed').length;
                      const isPaused = journey.status === 'paused';
                      return (
                        <div key={journey.id} className={`p-3 rounded-xl border ${isPaused ? 'bg-warning/5 border-warning/30' : 'bg-muted/50 border-border'}`} data-testid={`journey-${journey.id}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={journey.coachee_avatar} />
                              <AvatarFallback>{journey.coachee_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{journey.coachee_name}</p>
                              <p className="text-xs text-muted-foreground">{journey.mentorship_area}</p>
                            </div>
                            {isPaused && (
                              <Badge className="bg-warning/10 text-warning border-0 text-xs" data-testid={`paused-badge-${journey.id}`}>Paused</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Progress: {completed}/{journey.total_sessions} sessions</span>
                            <button
                              onClick={() => setEditSessionsModal({ open: true, request: journey, value: journey.total_sessions })}
                              className="text-primary hover:text-primary/80 flex items-center gap-0.5"
                              data-testid={`edit-sessions-${journey.id}`}
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          </div>
                          <div className="flex gap-2">
                            {!isPaused && (
                              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => setScheduleModal({ open: true, request: journey })} data-testid={`schedule-btn-${journey.id}`}>
                                <Calendar className="w-3 h-3 mr-1" /> Schedule
                              </Button>
                            )}
                            {isPaused ? (
                              <Button size="sm" className="bg-success hover:bg-success/90 text-white text-xs h-7 flex-1" onClick={() => handleRestartJourney(journey.id)} data-testid={`restart-btn-${journey.id}`}>
                                <Plus className="w-3 h-3 mr-1" /> Restart
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs h-7 flex-1 text-warning border-warning/30 hover:bg-warning/10" onClick={() => handlePauseJourney(journey.id)} data-testid={`pause-btn-${journey.id}`}>
                                <Clock className="w-3 h-3 mr-1" /> Pause
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability Calendar */}
            <AvailabilityCalendar user={user} />

            {/* Profile Card */}
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Your Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span className="text-foreground">{user?.experience}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Available Slots</span><span className="text-foreground font-medium">{user?.slots?.available}/{user?.slots?.total}</span></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(user?.certifications || []).map(c => (
                    <Badge key={c} variant="outline" className="text-xs px-2 py-0.5 bg-primary-subtle border-primary/20 text-primary">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Accept/Decline Dialog */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && setActionModal({ open: false, request: null, action: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {actionModal.action === 'accept' ? 'Accept Coaching Request?' : 'Decline Coaching Request?'}
            </DialogTitle>
          </DialogHeader>
          {actionModal.request && (
            <div>
              <div className="flex items-center gap-3 mb-4 bg-muted/50 rounded-xl p-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={actionModal.request.coachee_avatar} />
                  <AvatarFallback>{actionModal.request.coachee_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{actionModal.request.coachee_name}</p>
                  <p className="text-xs text-muted-foreground">{actionModal.request.coachee_role} · {actionModal.request.mentorship_area}</p>
                </div>
              </div>
              {actionModal.request.goals && (
                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-foreground/70 mb-1">Goals</p>
                  <p className="text-sm text-foreground">{actionModal.request.goals}</p>
                </div>
              )}
              {actionModal.action === 'accept' && (
                <div className="bg-accent-subtle border border-accent/30 rounded-xl p-3 mb-4">
                  <p className="text-xs text-foreground/80"><strong>What happens next:</strong> You will be assigned as this coachee's coach for {actionModal.request.total_sessions} sessions.</p>
                </div>
              )}
              {actionModal.action === 'decline' && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-foreground/80"><strong>Note:</strong> The request will be forwarded to the coachee's next preferred coach.</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActionModal({ open: false, request: null, action: null })}>Cancel</Button>
                {actionModal.action === 'accept' ? (
                  <Button className="bg-primary text-white" onClick={handleAccept} disabled={processing} data-testid="confirm-accept-btn">
                    {processing ? 'Accepting...' : 'Confirm Accept'}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleDecline} disabled={processing} data-testid="confirm-decline-btn">
                    {processing ? 'Declining...' : 'Confirm Decline'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Total Sessions Dialog */}
      <Dialog open={editSessionsModal.open} onOpenChange={(open) => !open && setEditSessionsModal({ open: false, request: null, value: 6 })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Total Sessions</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Set the total number of coaching sessions for <strong>{editSessionsModal.request?.coachee_name}</strong>.
            </p>
            <Input
              type="number"
              min={1}
              max={50}
              value={editSessionsModal.value}
              onChange={e => setEditSessionsModal(s => ({ ...s, value: parseInt(e.target.value) || 1 }))}
              className="mb-4"
              data-testid="edit-sessions-input"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditSessionsModal({ open: false, request: null, value: 6 })}>Cancel</Button>
              <Button className="bg-primary text-white" onClick={handleUpdateSessions} data-testid="save-sessions-btn">
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule modal */}
      {scheduleModal.request && (
        <ScheduleModal
          open={scheduleModal.open}
          onClose={() => setScheduleModal({ open: false, request: null })}
          coachId={user.id}
          coachName={scheduleModal.request.coachee_name}
          coachAvatar={scheduleModal.request.coachee_avatar}
          onConfirm={handleScheduleConfirm}
        />
      )}

      <RescheduleModal
        open={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, session: null })}
        session={rescheduleModal.session}
        coachId={user.id}
        onConfirm={handleRescheduleConfirm}
      />
    </div>
  );
}
