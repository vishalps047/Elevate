import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { SessionCard, ScheduleModal, RescheduleModal } from '../components/SessionComponents';
import { Button } from '../components/ui/button';
import { Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SessionsPage() {
  const { user, fetchNotifications } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const upcoming = sessions.filter(s => s.status === 'upcoming');
  const completed = sessions.filter(s => s.status === 'completed');
  const displayed = tab === 'upcoming' ? upcoming : completed;

  const handleRescheduleConfirm = async (slot, session) => {
    try {
      await api.rescheduleSession(session.id, { date: slot.date, time: slot.time });
      toast.success('Session rescheduled!');
      setRescheduleModal({ open: false, session: null });
      await loadSessions();
      fetchNotifications();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleCompleteSession = async (session) => {
    try {
      await api.completeSession(session.id);
      toast.success(`Session "${session.topic}" marked as completed`);
      await loadSessions();
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
      <PageHeader title="My Sessions" />
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === 'upcoming' ? 'default' : 'outline'}
            className={`text-sm h-9 ${tab === 'upcoming' ? 'bg-primary text-white' : ''}`}
            onClick={() => setTab('upcoming')}
            data-testid="tab-upcoming"
          >
            <Calendar className="w-4 h-4 mr-2" /> Upcoming ({upcoming.length})
          </Button>
          <Button
            variant={tab === 'completed' ? 'default' : 'outline'}
            className={`text-sm h-9 ${tab === 'completed' ? 'bg-primary text-white' : ''}`}
            onClick={() => setTab('completed')}
            data-testid="tab-completed"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Completed ({completed.length})
          </Button>
        </div>

        {/* Sessions */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-foreground font-medium">No {tab} sessions</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === 'upcoming' ? 'Schedule a session from your dashboard' : 'Complete sessions will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                role={user?.role}
                onReschedule={(s) => setRescheduleModal({ open: true, session: s })}
                onComplete={handleCompleteSession}
              />
            ))}
          </div>
        )}
      </div>

      <RescheduleModal
        open={rescheduleModal.open}
        onClose={() => setRescheduleModal({ open: false, session: null })}
        session={rescheduleModal.session}
        onConfirm={handleRescheduleConfirm}
      />
    </div>
  );
}
