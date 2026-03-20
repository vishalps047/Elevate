import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  TrendingUp, Users, Calendar, Target, Clock, ChevronRight,
  Bell, ArrowRight, BookOpen, CheckCircle, AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { mockSessions } from '../data/mockData';
import { SessionCard, FeedbackModal, ScheduleModal, RescheduleModal } from '../components/SessionComponents';
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
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(mockSessions);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, session: null });
  const [scheduleModal, setScheduleModal] = useState({ open: false });
  // Reschedule modal state — stores the session being rescheduled
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingFeedback = completedSessions.filter(s => !s.feedbackSubmitted);

  const handleFeedbackSubmit = ({ rating, comment }) => {
    setSessions(prev => prev.map(s =>
      s.id === feedbackModal.session?.id
        ? { ...s, feedbackSubmitted: true, rating, feedbackComment: comment }
        : s
    ));
  };

  // Called when a session is successfully rescheduled
  const handleRescheduleConfirm = (slot, session) => {
    setSessions(prev => prev.map(s =>
      s.id === session.id ? { ...s, date: slot.date, time: slot.time } : s
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-primary px-6 lg:px-10 py-6">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-heading font-bold text-white">Welcome back, {currentUser?.name?.split(' ')[0]} 👋</h1>
              <p className="text-white/70 text-sm mt-1">{currentUser?.jobTitle} · {currentUser?.department}</p>
            </div>
            <Button
              className="bg-accent hover:bg-accent/90 text-white self-start sm:self-auto shadow-md"
              onClick={() => navigate('/coaches')}
            >
              <Target className="w-4 h-4 mr-2" /> Find a Coach <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Pending Feedback Alert */}
        {pendingFeedback.length > 0 && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Feedback Required</p>
              <p className="text-xs text-muted-foreground mt-0.5">You have {pendingFeedback.length} session(s) awaiting feedback. Submit to unlock your next session.</p>
            </div>
            <Button size="sm" className="bg-warning text-white hover:bg-warning/90 h-8 text-xs flex-shrink-0"
              onClick={() => setFeedbackModal({ open: true, session: pendingFeedback[0] })}>
              Give Feedback
            </Button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Calendar} value={upcomingSessions.length} label="Upcoming Sessions" sub="Next: Feb 10" color="primary" />
          <StatCard icon={CheckCircle} value={completedSessions.length} label="Completed Sessions" sub="This program" color="success" />
          <StatCard icon={Users} value="1" label="Active Coaches" sub="Fatema Hunaid" color="warning" />
          <StatCard icon={TrendingUp} value="3/6" label="Program Progress" sub="Sessions completed" color="accent" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Coach Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="coach-banner relative">
                <div className="absolute inset-0 opacity-10 bg-white" />
              </div>
              <div className="p-5 -mt-6">
                <Avatar className="w-14 h-14 mb-3" style={{ border: '3px solid white' }}>
                  <AvatarImage src="https://randomuser.me/api/portraits/women/44.jpg" />
                  <AvatarFallback>FH</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">Fatema Hunaid</h3>
                    <p className="text-xs text-muted-foreground">Executive Coach</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-0 text-xs">Active</Badge>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Program Progress</span>
                    <span className="font-semibold text-primary">3 / 6 sessions</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={() => setScheduleModal({ open: true })}
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white text-xs h-8"
                    onClick={() => navigate('/sessions')}
                  >
                    View Sessions <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5 mt-4">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Browse Coaches', icon: Users, action: () => navigate('/coaches'), color: 'text-primary' },
                  { label: 'My Sessions', icon: Calendar, action: () => navigate('/sessions'), color: 'text-accent' },
                  { label: 'Coaching History', icon: BookOpen, action: () => {}, color: 'text-warning' },
                  { label: 'Help & Support', icon: Bell, action: () => {}, color: 'text-muted-foreground' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-fast text-left"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sessions Panel */}
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
                  <SessionCard
                    key={s.id}
                    session={s}
                    role="coachee"
                    onFeedback={(s) => setFeedbackModal({ open: true, session: s })}
                    onReschedule={(s) => setRescheduleModal({ open: true, session: s })}
                  />
                )) : (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                    <Button size="sm" className="mt-3 bg-primary text-white text-xs" onClick={() => setScheduleModal({ open: true })}>
                      Schedule a Session
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Completed */}
            <div className="bg-card rounded-xl border border-border shadow-card p-5 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-foreground">Past Sessions</h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={() => navigate('/sessions')}>
                  View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {completedSessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    role="coachee"
                    onFeedback={(s) => setFeedbackModal({ open: true, session: s })}
                    onReschedule={() => {}}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FeedbackModal
        open={feedbackModal.open}
        onClose={() => setFeedbackModal({ open: false, session: null })}
        session={feedbackModal.session}
        onSubmit={handleFeedbackSubmit}
      />
      <ScheduleModal
        open={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false })}
        coachName="Fatema Hunaid"
        coachAvatar="https://randomuser.me/api/portraits/women/44.jpg"
        onConfirm={(slot) => {
          toast.success(`Session booked for ${slot.date} at ${slot.time}`);
        }}
      />
      {/* Reschedule: coachee rescheduling → notifies coach + admin */}
      <RescheduleModal
        open={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, session: null })}
        session={rescheduleModal.session}
        initiatorRole="coachee"
        onConfirm={handleRescheduleConfirm}
      />
    </div>
  );
}
