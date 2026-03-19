import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { SessionCard, ScheduleModal } from '../components/SessionComponents';
import { toast } from 'sonner';
import {
  Users, Calendar, Star, TrendingUp, ChevronRight, CheckCircle,
  XCircle, Clock, Eye, BarChart2, Award, AlertTriangle, Info
} from 'lucide-react';
import { mockRequests, mockCoachSessions } from '../data/mockData';
import { StarRating } from '../components/CoachCard';

function AcceptRequestModal({ open, onClose, request, onAccept, onDecline }) {
  const [action, setAction] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleAccept = () => {
    setProcessing(true);
    setTimeout(() => {
      onAccept(request.id);
      toast.success(`Request from ${request.coacheeName} accepted!`, {
        description: 'They can now schedule sessions with you.'
      });
      onClose();
      setProcessing(false);
    }, 1000);
  };

  const handleDecline = () => {
    setProcessing(true);
    setTimeout(() => {
      onDecline(request.id);
      toast.info(`Request from ${request.coacheeName} declined.`);
      onClose();
      setProcessing(false);
    }, 800);
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-subtle rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            Accept Coaching Request
          </DialogTitle>
        </DialogHeader>

        {/* Coachee Info */}
        <div className="flex items-center gap-3 p-3 border border-border rounded-xl">
          <Avatar className="w-12 h-12">
            <AvatarImage src={request.coacheeAvatar} />
            <AvatarFallback>{request.coacheeName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-semibold text-foreground">{request.coacheeName}</span>
              <Badge variant="outline" className="text-xs border-border">{request.coacheeRole}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Mentorship required on: <span className="font-medium text-foreground">{request.mentorshipArea}</span></p>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8">
            <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
          </Button>
        </div>

        {/* Goals */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Coaching Goals & Preferences</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { q: 'Q1. What are your main coaching goals? *', a: request.goals },
              { q: 'Q2. What are your current challenges?', a: request.challenges },
              { q: 'Q3. Previous coaching or training experience. (If any)', a: request.previousExperience },
              { q: 'Additional notes (optional)', a: request.notes || 'None' },
            ].map(({ q, a }) => (
              <div key={q} className="border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1.5">{q}</p>
                <p className="text-sm text-primary font-medium">{a || <span className="text-muted-foreground italic">Not provided</span>}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-accent-subtle border border-accent/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-accent" />
            <p className="text-sm font-semibold text-foreground">What happens next?</p>
          </div>
          <ul className="space-y-1.5">
            {[
              `Confirmation email sent to ${request.coacheeName}`,
              'Elevate management team will be notified of your acceptance',
              'Coachee can now schedule sessions with you',
              'Your capacity will be updated automatically',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="mt-0.5">•</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleDecline} disabled={processing} className="gap-2">
            <XCircle className="w-4 h-4 text-destructive" /> Decline
          </Button>
          <Button
            className="bg-accent hover:bg-accent/90 text-white gap-2"
            onClick={handleAccept}
            disabled={processing}
          >
            {processing ? 'Processing...' : <><CheckCircle className="w-4 h-4" /> Accept Request</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CoachDashboard() {
  const { setCurrentRole } = useApp();
  // Always use the coach mock user on this page
  const currentUser = { id: 'c1', name: 'Fatema Hunaid', title: 'Executive Coach', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', coacheesEnrolled: 1, totalCapacity: 2, overallRating: 4.8, totalSessions: 24 };
  const [requests, setRequests] = useState(mockRequests);
  const [sessions, setSessions] = useState(mockCoachSessions);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [scheduleModal, setScheduleModal] = useState({ open: false });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const declinedRequests = requests.filter(r => r.status === 'declined');

  const handleAccept = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' } : r));
  };
  const handleDecline = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' } : r));
  };

  const ratingData = [
    { label: '5 Star', count: 18, pct: 75 },
    { label: '4 Star', count: 4, pct: 17 },
    { label: '3 Star', count: 1, pct: 4 },
    { label: '2 Star', count: 1, pct: 4 },
    { label: '1 Star', count: 0, pct: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-gradient-primary px-6 lg:px-10 py-6">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-heading font-bold text-white mb-4">Coach Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Coach Info Card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 flex-1">
              <Avatar className="w-14 h-14" style={{ border: '3px solid rgba(255,255,255,0.4)' }}>
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback className="bg-white/20 text-white">{currentUser?.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-heading font-semibold text-white">{currentUser?.name}</h3>
                <p className="text-white/70 text-xs">{currentUser?.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  <StarRating rating={currentUser?.overallRating || 4.8} />
                  <span className="text-white/80 text-xs">{currentUser?.overallRating || 4.8}</span>
                </div>
              </div>
            </div>
            {/* Stats */}
            {[
              { label: 'Coachees Enrolled', value: currentUser?.coacheesEnrolled || 1, icon: Users },
              { label: 'Sessions Conducted', value: currentUser?.totalSessions || 24, icon: Calendar },
              { label: 'Pending Requests', value: pendingRequests.length, icon: Clock },
              { label: 'Capacity Used', value: `${currentUser?.coacheesEnrolled || 1}/${currentUser?.totalCapacity || 2}`, icon: BarChart2 },
            ].map(stat => (
              <div key={stat.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 flex-1 min-w-[120px]">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-white/70" />
                </div>
                <p className="text-2xl font-heading font-bold text-white">{stat.value}</p>
                <p className="text-white/70 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Requests */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="pending">
              <div className="flex items-center justify-between mb-3">
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-destructive"></span>
                      Pending ({pendingRequests.length})
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="accepted" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    Accepted ({acceptedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                    All Requests
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pending">
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">No pending requests</p>
                    </div>
                  ) : pendingRequests.map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onViewDetails={() => setSelectedRequest(req)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="accepted">
                <div className="space-y-3">
                  {acceptedRequests.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <p className="text-sm text-muted-foreground">No accepted requests yet</p>
                    </div>
                  ) : acceptedRequests.map(req => (
                    <RequestCard key={req.id} request={req} showActions={false} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="all">
                <div className="space-y-3">
                  {requests.map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onViewDetails={req.status === 'pending' ? () => setSelectedRequest(req) : undefined}
                      showStatus
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Upcoming Sessions */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-foreground">Upcoming Sessions</h3>
                <Button variant="ghost" size="sm" className="text-xs text-primary h-7">
                  View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessions.map(s => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    role="coach"
                    onReschedule={() => setScheduleModal({ open: true })}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Rating & Stats */}
          <div className="space-y-4">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-foreground mb-4">Overall Rating</h3>
                <div className="text-center mb-4">
                  <p className="text-5xl font-heading font-bold text-warning">{currentUser?.overallRating || 4.8}</p>
                  <StarRating rating={currentUser?.overallRating || 4.8} size="lg" />
                  <p className="text-xs text-muted-foreground mt-1">Based on {currentUser?.totalSessions || 24} Sessions</p>
                </div>
                <div className="space-y-2">
                  {ratingData.map(r => (
                    <div key={r.label} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">{r.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div
                          className="h-full rounded-full bg-warning transition-smooth"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-4">{r.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Coachees */}
            <Card className="shadow-card">
              <CardContent className="p-5">
                <h3 className="font-heading font-semibold text-foreground mb-3">Active Coachees</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Sarah Johnson', role: 'Senior Associate', avatar: 'https://randomuser.me/api/portraits/women/10.jpg', progress: 50 },
                  ].map(coachee => (
                    <div key={coachee.name} className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={coachee.avatar} />
                        <AvatarFallback>{coachee.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{coachee.name}</p>
                        <p className="text-xs text-muted-foreground">{coachee.role}</p>
                        <Progress value={coachee.progress} className="h-1.5 mt-1" />
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-semibold text-primary">{currentUser?.coacheesEnrolled || 1}/{currentUser?.totalCapacity || 2}</span>
                    </div>
                    <Progress value={((currentUser?.coacheesEnrolled || 1) / (currentUser?.totalCapacity || 2)) * 100} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability Card */}
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-foreground">Availability</h3>
                  <Button variant="outline" size="sm" className="text-xs h-7">Edit</Button>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { day: 'Monday', times: '9 AM - 12 PM' },
                    { day: 'Tuesday', times: '2 PM - 5 PM' },
                    { day: 'Thursday', times: '10 AM - 1 PM' },
                    { day: 'Friday', times: '3 PM - 6 PM' },
                  ].map(slot => (
                    <div key={slot.day} className="flex justify-between">
                      <span className="text-muted-foreground">{slot.day}</span>
                      <span className="font-medium text-foreground">{slot.times}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AcceptRequestModal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <ScheduleModal
        open={scheduleModal.open}
        onClose={() => setScheduleModal({ open: false })}
        coachName="Scheduling Session"
        coachAvatar={null}
        onConfirm={(slot) => toast.success(`Session updated for ${slot.date} at ${slot.time}`)}
      />
    </div>
  );
}

function RequestCard({ request, onViewDetails, showActions = true, showStatus = false }) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'status-pending' },
    accepted: { label: 'Accepted', className: 'status-accepted' },
    declined: { label: 'Declined', className: 'status-declined' },
  };
  const cfg = statusConfig[request.status] || statusConfig.pending;

  return (
    <Card className="shadow-card hover:shadow-md transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={request.coacheeAvatar} />
            <AvatarFallback>{request.coacheeName.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-semibold text-sm text-foreground">{request.coacheeName}</span>
              <Badge variant="outline" className="text-xs border-border">{request.coacheeRole}</Badge>
              {showStatus && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.className}`}>{cfg.label}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mentorship required on: <span className="font-medium text-foreground">{request.mentorshipArea}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Submitted {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          {showActions && request.status === 'pending' && onViewDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary h-7 flex-shrink-0"
              onClick={onViewDetails}
            >
              View Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
