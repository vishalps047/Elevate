import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Users, Calendar, TrendingUp, ChevronRight, CheckCircle,
  Clock, Target, XCircle, MessageSquare, BookOpen, ArrowRight
} from 'lucide-react';
import { SessionCard, ScheduleModal, RescheduleModal } from '../components/SessionComponents';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '../components/ui/dialog';

function StatCard({ icon: Icon, value, label, sub, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-subtle text-primary',
    accent: 'bg-accent-subtle text-accent',
    warning: 'bg-yellow-50 text-warning',
    success: 'bg-green-50 text-success',
  };
  return (
    <Card className="shadow-card">
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

export default function CoachDashboard() {
  const { user, fetchNotifications } = useApp();
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, request: null, action: null });
  const [processing, setProcessing] = useState(false);
  const [scheduleModal, setScheduleModal] = useState({ open: false, request: null });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });

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

  // Filter requests: pending ones assigned to this coach
  const pendingRequests = requests.filter(r => {
    if (r.status !== 'pending') return false;
    const idx = r.current_preference_index;
    const pref = r.preferences?.[idx];
    return pref?.coach_id === user?.id && pref?.status === 'pending';
  });

  // Active coaching journeys (accepted by this coach)
  const activeJourneys = requests.filter(r => r.status === 'accepted' && r.active_coach_id === user?.id);

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
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!actionModal.request) return;
    setProcessing(true);
    try {
      await api.declineRequest(actionModal.request.id);
      toast.info(`Request declined. The coachee will be notified.`);
      setActionModal({ open: false, request: null, action: null });
      await loadData();
      fetchNotifications();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleScheduleConfirm = async (slot) => {
    try {
      await api.createSession({ request_id: scheduleModal.request.id, date: slot.date, time: slot.time });
      toast.success('Session scheduled!');
      setScheduleModal({ open: false, request: null });
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
      setRescheduleModal({ open: false, session: null });
      await loadData();
      fetchNotifications();
    } catch (e) {
      toast.error(e.message);
    }
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
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-3 border-white/30">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary-light text-white">{user?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-heading font-semibold text-white" data-testid="coach-welcome">{user?.name}</h3>
              <p className="text-white/70 text-xs">{user?.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={MessageSquare} value={pendingRequests.length} label="Pending Requests" color="warning" />
          <StatCard icon={Users} value={activeJourneys.length} label="Active Coachees" color="primary" />
          <StatCard icon={Calendar} value={upcomingSessions.length} label="Upcoming Sessions" color="accent" />
          <StatCard icon={TrendingUp} value={completedSessions.length} label="Completed Sessions" color="success" />
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
                    {pendingRequests.map(req => (
                      <div key={req.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-4 border border-border" data-testid={`request-${req.id}`}>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={req.coachee_avatar} />
                          <AvatarFallback>{req.coachee_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{req.coachee_name}</p>
                          <p className="text-xs text-muted-foreground">{req.coachee_role} · {req.mentorship_area}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.goals}</p>
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
                    ))}
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
                      <SessionCard key={s.id} session={s} role="coach" onReschedule={(s) => setRescheduleModal({ open: true, session: s })} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Active Coachees */}
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
                      return (
                        <div key={journey.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-fast">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={journey.coachee_avatar} />
                            <AvatarFallback>{journey.coachee_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{journey.coachee_name}</p>
                            <p className="text-xs text-muted-foreground">{completed}/{journey.total_sessions} sessions</p>
                          </div>
                          <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setScheduleModal({ open: true, request: journey })}>
                            <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-foreground text-sm mb-3">Your Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="text-foreground">{user?.location}</span></div>
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

      {/* Accept/Decline Confirm Dialog */}
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
                  <p className="text-xs text-foreground/80"><strong>What happens next:</strong> You will be assigned as this coachee's coach. A total of {actionModal.request.total_sessions} sessions will be planned.</p>
                </div>
              )}
              {actionModal.action === 'decline' && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mb-4">
                  <p className="text-xs text-foreground/80"><strong>Note:</strong> The request will be automatically forwarded to the coachee's next preferred coach.</p>
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

      {/* Schedule modal for active journeys */}
      {scheduleModal.request && (
        <ScheduleModal
          open={scheduleModal.open}
          onClose={() => setScheduleModal({ open: false, request: null })}
          coachName={scheduleModal.request.coachee_name}
          coachAvatar={scheduleModal.request.coachee_avatar}
          onConfirm={handleScheduleConfirm}
        />
      )}

      <RescheduleModal
        open={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, session: null })}
        session={rescheduleModal.session}
        onConfirm={handleRescheduleConfirm}
      />
    </div>
  );
}
