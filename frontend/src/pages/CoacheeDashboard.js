import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  TrendingUp, Users, Calendar, Target, Clock, ChevronRight,
  ArrowRight, BookOpen, CheckCircle, AlertCircle, Flag, Send, History
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { SessionCard, ScheduleModal, RescheduleModal } from '../components/SessionComponents';
import { toast } from 'sonner';

function StatCard({ icon: Icon, value, label, sub, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-subtle text-primary',
    accent: 'bg-accent-subtle text-accent',
    warning: 'bg-yellow-50 text-warning',
    success: 'bg-green-50 text-success',
  };
  return (
    <Card className="shadow-card hover:shadow-md transition-smooth">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground/80 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoacheeDashboard() {
  const { user, fetchNotifications } = useApp();
  const navigate = useNavigate();
  const [activeRequest, setActiveRequest] = useState(null);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState({ open: false });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });
  const [completingJourney, setCompletingJourney] = useState(false);
  const [feedbackState, setFeedbackState] = useState({ rating: 0, comment: '', submitting: false });
  const [hoveredStar, setHoveredStar] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, sessRes] = await Promise.all([api.getActiveRequest(), api.getSessions()]);
      setActiveRequest(reqRes.request);
      setAllSessions(sessRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Scope sessions to the active request
  const currentSessions = activeRequest ? allSessions.filter(s => s.request_id === activeRequest.id) : [];
  const upcomingSessions = currentSessions.filter(s => s.status === 'upcoming');
  const completedSessions = currentSessions.filter(s => s.status === 'completed');

  // Past sessions (from completed journeys)
  const pastSessions = allSessions.filter(s => !activeRequest || s.request_id !== activeRequest.id);

  const totalSessions = activeRequest?.total_sessions || 6;

  const activeCoach = activeRequest?.status === 'accepted'
    ? activeRequest.preferences.find(p => p.status === 'accepted')
    : null;

  const handleCompleteJourney = async () => {
    if (!activeRequest) return;
    setCompletingJourney(true);
    try {
      await api.completeJourney(activeRequest.id);
      toast.success('Journey completed! Please submit your feedback.');
      await loadData();
      fetchNotifications();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCompletingJourney(false);
    }
  };

  const handleFeedback = async () => {
    if (feedbackState.rating === 0) { toast.error('Please select a rating'); return; }
    setFeedbackState(s => ({ ...s, submitting: true }));
    try {
      await api.submitFeedback(activeRequest.id, { rating: feedbackState.rating, comment: feedbackState.comment });
      toast.success('Feedback submitted! You can now find a new coach.');
      setFeedbackState({ rating: 0, comment: '', submitting: false });
      await loadData();
    } catch (e) {
      toast.error(e.message);
      setFeedbackState(s => ({ ...s, submitting: false }));
    }
  };

  const handleScheduleConfirm = async (slot) => {
    try {
      await api.createSession({ request_id: activeRequest.id, date: slot.date, time: slot.time, topic: slot.topic || 'Coaching Session' });
      toast.success(`Session booked for ${slot.day || slot.date} at ${slot.time}`);
      await loadData();
      fetchNotifications();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleRescheduleConfirm = async (slot, session) => {
    try {
      await api.rescheduleSession(session.id, { date: slot.date, time: slot.time });
      toast.success('Session rescheduled!');
      await loadData();
      fetchNotifications();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const needsFeedback = activeRequest?.status === 'completed' && !activeRequest?.feedback_submitted;
  const hasActiveJourney = activeRequest?.status === 'accepted';
  const hasPendingRequest = activeRequest?.status === 'pending';
  const canFindCoach = !activeRequest;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary px-6 lg:px-10 py-6">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-heading font-bold text-white" data-testid="coachee-welcome">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-white/70 text-sm mt-1">{user?.job_title} · {user?.department}</p>
            </div>
            {canFindCoach && (
              <Button className="bg-accent hover:bg-accent/90 text-white self-start sm:self-auto shadow-md" onClick={() => navigate('/coaches')} data-testid="find-coach-btn">
                <Target className="w-4 h-4 mr-2" /> Find a Coach <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Calendar} value={upcomingSessions.length} label="Upcoming Sessions" color="primary" />
          <StatCard icon={CheckCircle} value={completedSessions.length} label="Completed Sessions" color="success" />
          <StatCard icon={Users} value={hasActiveJourney ? '1' : '0'} label="Active Coaches" color="warning" />
          <StatCard icon={TrendingUp} value={`${completedSessions.length}/${totalSessions}`} label="Program Progress" color="accent" />
        </div>

        {/* Feedback Required */}
        {needsFeedback && (
          <Card className="shadow-card mb-6 border-warning/30" data-testid="feedback-card">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Journey Complete - Feedback Required</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You completed {completedSessions.length} session{completedSessions.length !== 1 ? 's' : ''} out of {totalSessions}. Submit feedback to unlock the ability to find a new coach.
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-semibold mb-2 block">How was your coaching experience?</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setFeedbackState(s => ({ ...s, rating: star }))} className="transition-fast">
                      <svg className={`w-8 h-8 transition-fast ${star <= (hoveredStar || feedbackState.rating) ? 'fill-warning text-warning scale-110' : 'fill-muted text-muted-foreground'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                  {(hoveredStar || feedbackState.rating) > 0 && <span className="text-sm font-medium text-warning ml-1">{ratingLabels[hoveredStar || feedbackState.rating]}</span>}
                </div>
              </div>
              <textarea
                className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm resize-none min-h-[70px] focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
                placeholder="Share your thoughts about the coaching experience..."
                value={feedbackState.comment}
                onChange={e => setFeedbackState(s => ({ ...s, comment: e.target.value }))}
              />
              <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleFeedback} disabled={feedbackState.submitting} data-testid="submit-feedback-btn">
                {feedbackState.submitting ? 'Submitting...' : 'Submit Feedback'}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pending Request Status */}
        {hasPendingRequest && (
          <Card className="shadow-card mb-6 border-primary/30" data-testid="pending-request-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Coaching Request Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your request is being reviewed. Currently waiting on preference #{(activeRequest.current_preference_index || 0) + 1}:
                    <strong className="text-foreground ml-1">{activeRequest.preferences[activeRequest.current_preference_index]?.coach_name}</strong>
                  </p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {activeRequest.preferences.map((pref, i) => (
                      <div key={i} className={`text-xs px-3 py-1.5 rounded-lg border ${
                        pref.status === 'pending' ? 'bg-primary-subtle border-primary/30 text-primary font-medium' :
                        pref.status === 'declined' ? 'bg-destructive/10 border-destructive/30 text-destructive line-through' :
                        'bg-muted border-border text-muted-foreground'
                      }`}>
                        #{pref.order} {pref.coach_name}
                        {pref.status === 'pending' && ' (Reviewing)'}
                        {pref.status === 'declined' && ' (Declined)'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No active request */}
        {canFindCoach && (
          <Card className="shadow-card mb-6 border-accent/30" data-testid="no-coach-card">
            <CardContent className="p-6 text-center">
              <Target className="w-12 h-12 text-accent mx-auto mb-3 opacity-60" />
              <h3 className="font-heading font-semibold text-foreground mb-1">Ready for Your Next Coaching Journey?</h3>
              <p className="text-sm text-muted-foreground mb-4">Browse available coaches and select up to 3 preferences.</p>
              <Button className="bg-accent hover:bg-accent/90 text-white" onClick={() => navigate('/coaches')} data-testid="browse-coaches-btn">
                <Users className="w-4 h-4 mr-2" /> Browse Coaches <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Journey */}
        {hasActiveJourney && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <div className="coach-banner relative">
                  <div className="absolute inset-0 opacity-10 bg-white" />
                </div>
                <div className="p-5 -mt-6">
                  <Avatar className="w-14 h-14 mb-3" style={{ border: '3px solid white' }}>
                    <AvatarImage src={activeCoach?.coach_avatar} />
                    <AvatarFallback>{activeCoach?.coach_name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground" data-testid="active-coach-name">{activeCoach?.coach_name}</h3>
                      <p className="text-xs text-muted-foreground">Your assigned coach</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-0 text-xs">Active</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Program Progress</span>
                      <span className="font-semibold text-primary">{completedSessions.length} / {totalSessions} sessions</span>
                    </div>
                    <Progress value={(completedSessions.length / totalSessions) * 100} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setScheduleModal({ open: true })} data-testid="schedule-session-btn">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule
                    </Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs h-8" onClick={() => navigate('/sessions')}>
                      View Sessions <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                  <Button
                    className="w-full mt-3 bg-warning hover:bg-warning/90 text-white text-xs h-9"
                    onClick={handleCompleteJourney}
                    disabled={completingJourney}
                    data-testid="complete-journey-btn"
                  >
                    <Flag className="w-3.5 h-3.5 mr-1" />
                    {completingJourney ? 'Completing...' : 'Complete Journey (Demo)'}
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-card p-5 mt-4">
                <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: 'My Sessions', icon: Calendar, action: () => navigate('/sessions'), color: 'text-accent' },
                    { label: 'Help & Support', icon: BookOpen, action: () => {}, color: 'text-muted-foreground' },
                  ].map(item => (
                    <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-fast text-left hover:bg-muted">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-sm text-foreground">{item.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-foreground">Upcoming Sessions</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={() => navigate('/sessions')}>
                    View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {upcomingSessions.length > 0 ? upcomingSessions.map(s => (
                    <SessionCard key={s.id} session={s} role="coachee" onReschedule={(s) => setRescheduleModal({ open: true, session: s })} />
                  )) : (
                    <div className="text-center py-8">
                      <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                      <Button size="sm" className="mt-3 bg-primary text-white text-xs" onClick={() => setScheduleModal({ open: true })}>Schedule a Session</Button>
                    </div>
                  )}
                </div>
              </div>

              {completedSessions.length > 0 && (
                <div className="bg-card rounded-xl border border-border shadow-card p-5 mt-4">
                  <h3 className="font-heading font-semibold text-foreground mb-4">Completed Sessions</h3>
                  <div className="space-y-3">
                    {completedSessions.map(s => (
                      <SessionCard key={s.id} session={s} role="coachee" onReschedule={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Past Sessions History */}
        {pastSessions.length > 0 && !hasActiveJourney && !hasPendingRequest && (
          <div className="bg-card rounded-xl border border-border shadow-card p-5 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-heading font-semibold text-foreground">Past Sessions</h3>
              <Badge variant="outline" className="text-xs">{pastSessions.length} sessions</Badge>
            </div>
            <div className="space-y-3">
              {pastSessions.slice(0, 5).map(s => (
                <SessionCard key={s.id} session={s} role="coachee" onReschedule={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeCoach && activeRequest && (
        <ScheduleModal
          open={scheduleModal.open}
          onClose={() => setScheduleModal({ open: false })}
          coachId={activeRequest.active_coach_id}
          coachName={activeCoach.coach_name}
          coachAvatar={activeCoach.coach_avatar}
          onConfirm={handleScheduleConfirm}
        />
      )}
      <RescheduleModal
        open={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, session: null })}
        session={rescheduleModal.session}
        coachId={activeRequest?.active_coach_id}
        onConfirm={handleRescheduleConfirm}
      />
    </div>
  );
}
