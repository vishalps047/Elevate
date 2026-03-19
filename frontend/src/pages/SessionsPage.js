import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SessionCard, FeedbackModal, ScheduleModal, RescheduleModal } from '../components/SessionComponents';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { mockSessions } from '../data/mockData';
import { toast } from 'sonner';

export default function SessionsPage() {
  const [sessions, setSessions] = useState(mockSessions);
  const [feedbackModal, setFeedbackModal] = useState({ open: false, session: null });
  const [scheduleModal, setScheduleModal] = useState({ open: false });
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, session: null });

  const upcoming = sessions.filter(s => s.status === 'upcoming');
  const completed = sessions.filter(s => s.status === 'completed');

  const handleFeedbackSubmit = ({ rating, comment }) => {
    setSessions(prev => prev.map(s =>
      s.id === feedbackModal.session?.id
        ? { ...s, feedbackSubmitted: true, rating, feedbackComment: comment }
        : s
    ));
  };

  const handleRescheduleConfirm = (slot, session) => {
    setSessions(prev => prev.map(s =>
      s.id === session.id ? { ...s, date: slot.date, time: slot.time } : s
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My Sessions" subtitle="Manage and track your coaching sessions">
        <Button
          className="bg-accent hover:bg-accent/90 text-white text-sm"
          onClick={() => setScheduleModal({ open: true })}
        >
          <Plus className="w-4 h-4 mr-2" /> Schedule Session
        </Button>
      </PageHeader>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Completed ({completed.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-foreground font-medium">No upcoming sessions</p>
                <p className="text-muted-foreground text-sm mt-1">Schedule your next coaching session</p>
                <Button size="sm" className="mt-4 bg-primary text-white" onClick={() => setScheduleModal({ open: true })}>
                  Schedule Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcoming.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    role="coachee"
                    onFeedback={(s) => setFeedbackModal({ open: true, session: s })}
                    onReschedule={(s) => setRescheduleModal({ open: true, session: s })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completed.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  role="coachee"
                  onFeedback={(s) => setFeedbackModal({ open: true, session: s })}
                  onReschedule={() => {}}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

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
          const newSession = {
            id: `s${Date.now()}`,
            coachName: 'Fatema Hunaid',
            coachAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
            coacheeId: 'u1',
            coacheeName: 'Sarah Johnson',
            status: 'upcoming',
            date: slot.date,
            time: slot.time,
            duration: 60,
            topic: 'Coaching Session',
            sessionNumber: sessions.length + 1,
            totalSessions: 6,
            notes: '',
            meetingLink: 'https://meet.google.com/new',
          };
          setSessions(prev => [newSession, ...prev]);
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
