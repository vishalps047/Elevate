import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import AdminRegistrations from '../components/AdminRegistrations';
import AdminMIS from '../components/AdminMIS';
import {
  Users, Calendar, TrendingUp, Award, Clock, CheckCircle,
  ChevronRight, Star, Pause, Eye,
  UserPlus, FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const CHART_COLORS = ['hsl(271, 65%, 28%)', 'hsl(142, 71%, 42%)', 'hsl(35, 92%, 55%)', 'hsl(352, 83%, 55%)', 'hsl(200, 65%, 50%)', 'hsl(280, 50%, 55%)'];

const CHART_TICK = { fontSize: 11 };
const CHART_TOOLTIP = { borderRadius: '8px', fontSize: '12px' };
const CHART_LEGEND = { fontSize: '11px' };
const CHART_DOT = { r: 3 };
const BAR_RADIUS = [4, 4, 0, 0];

function StatCard({ icon: Icon, value, label, color = 'primary', sub }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
    destructive: 'bg-destructive/10 text-destructive',
  };
  return (
    <Card className="shadow-card" data-testid={`stat-${label.toLowerCase().replace(/\s+/g,'-')}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xl font-heading font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user } = useApp();
  const [stats, setStats] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [coachees, setCoachees] = useState([]);
  const [trends, setTrends] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [mis, setMis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations');
  const [userModal, setUserModal] = useState({ open: false, data: null, loading: false });
  const [regFilter, setRegFilter] = useState('pending');

  const loadData = useCallback(async () => {
    try {
      const [s, c, ce, t, r, m] = await Promise.all([
        api.getAdminStats(),
        api.getAdminCoaches(),
        api.getAdminCoachees(),
        api.getAdminTrends(),
        api.getRegistrations('all'),
        api.getAdminMIS(),
      ]);
      setStats(s);
      setCoaches(c);
      setCoachees(ce);
      setTrends(t);
      setRegistrations(r);
      setMis(m);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openUserHistory = async (userId) => {
    setUserModal({ open: true, data: null, loading: true });
    try {
      const data = await api.getAdminUserHistory(userId);
      setUserModal({ open: true, data, loading: false });
    } catch (e) {
      toast.error(e.message);
      setUserModal({ open: false, data: null, loading: false });
    }
  };

  const handleApproveReg = async (id) => {
    try {
      const res = await api.approveRegistration(id);
      toast.success(res.message);
      await loadData();
    } catch (e) { toast.error(e.message); }
  };

  const handleRejectReg = async (id) => {
    try {
      const res = await api.rejectRegistration(id);
      toast.success(res.message);
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

  const topCoaches = [...coaches].filter(c => c.feedback_rating).sort((a, b) => b.feedback_rating - a.feedback_rating);

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <PageHeader title="Admin Dashboard" />
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-xl text-foreground">Platform Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time coaching platform analytics and management</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} value={stats?.total_coaches} label="Total Coaches" color="primary" />
          <StatCard icon={Users} value={stats?.total_coachees} label="Total Coachees" color="accent" />
          <StatCard icon={Calendar} value={stats?.total_sessions} label="Total Sessions" color="success" />
          <StatCard icon={Clock} value={stats?.pending_requests} label="Pending Requests" color="warning" />
          <StatCard icon={Star} value={stats?.avg_rating || '-'} label="Avg Rating" color="primary" sub="From feedback" />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={CheckCircle} value={stats?.completed_sessions} label="Completed Sessions" color="success" />
          <StatCard icon={TrendingUp} value={stats?.active_journeys} label="Active Journeys" color="primary" />
          <StatCard icon={Pause} value={stats?.paused_journeys} label="Paused Journeys" color="warning" />
          <StatCard icon={Award} value={`${stats?.completion_rate}%`} label="Completion Rate" color="accent" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-3 overflow-x-auto">
          {[
            { key: 'registrations', label: `Registrations ${registrations.filter(r => r.status === 'pending').length ? `(${registrations.filter(r => r.status === 'pending').length})` : ''}`, icon: UserPlus },
            { key: 'coaches', label: 'Coaches', icon: Award },
            { key: 'coachees', label: 'Coachees', icon: Users },
            { key: 'mis', label: 'MIS Reports', icon: FileSpreadsheet },
          ].map(t => (
            <Button
              key={t.key}
              variant={activeTab === t.key ? 'default' : 'ghost'}
              className={`text-sm h-9 ${activeTab === t.key ? 'bg-primary text-white' : ''}`}
              onClick={() => setActiveTab(t.key)}
              data-testid={`tab-${t.key}`}
            >
              <t.icon className="w-4 h-4 mr-1.5" /> {t.label}
            </Button>
          ))}
        </div>

        {/* Coaches Tab */}
        {activeTab === 'coaches' && (
          <div className="space-y-3">
            {coaches.map(coach => (
              <div
                key={coach.id}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-card cursor-pointer hover:bg-muted/30 transition-fast"
                onClick={() => openUserHistory(coach.id)}
                data-testid={`coach-row-${coach.id}`}
              >
                <Avatar className="w-11 h-11">
                  <AvatarImage src={coach.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">{coach.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{coach.name}</p>
                  <p className="text-xs text-muted-foreground">{coach.title}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(coach.expertise || []).slice(0, 3).map(e => (
                      <span key={e} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center flex-shrink-0">
                  <div>
                    <p className="text-sm font-bold text-foreground">{coach.session_count}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{coach.active_coachees}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    {coach.feedback_rating ? (
                      <>
                        <div className="flex items-center gap-1 justify-center">
                          <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                          <span className="text-sm font-bold text-foreground">{coach.feedback_rating}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{coach.feedback_count} reviews</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">No rating</p>
                    )}
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Coachees Tab */}
        {activeTab === 'coachees' && (
          <div className="space-y-3">
            {coachees.map(coachee => (
              <div
                key={coachee.id}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-card cursor-pointer hover:bg-muted/30 transition-fast"
                onClick={() => openUserHistory(coachee.id)}
                data-testid={`coachee-row-${coachee.id}`}
              >
                <Avatar className="w-11 h-11">
                  <AvatarImage src={coachee.avatar} />
                  <AvatarFallback className="bg-accent/10 text-accent">{coachee.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{coachee.name}</p>
                  <p className="text-xs text-muted-foreground">{coachee.email}</p>
                </div>
                <div className="flex items-center gap-6 text-center flex-shrink-0">
                  <div>
                    <p className="text-sm font-bold text-foreground">{coachee.session_count}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{coachee.journey_count}</p>
                    <p className="text-xs text-muted-foreground">Journeys</p>
                  </div>
                  <div>
                    {coachee.active_journey_status ? (
                      <Badge className={`border-0 text-xs ${
                        coachee.active_journey_status === 'accepted' ? 'bg-success/10 text-success' :
                        coachee.active_journey_status === 'paused' ? 'bg-warning/10 text-warning' :
                        'bg-primary/10 text-primary'
                      }`}>{coachee.active_journey_status}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </div>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <AdminRegistrations
            registrations={registrations}
            regFilter={regFilter}
            setRegFilter={setRegFilter}
            onApprove={handleApproveReg}
            onReject={handleRejectReg}
          />
        )}

        {/* MIS Reports Tab */}
        {activeTab === 'mis' && (
          <AdminMIS mis={mis} />
        )}

      </div>

      {/* User Detail Modal */}
      <Dialog open={userModal.open} onOpenChange={(open) => !open && setUserModal({ open: false, data: null, loading: false })}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="user-history-modal">
          {userModal.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : userModal.data ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={userModal.data.user.avatar} />
                    <AvatarFallback>{userModal.data.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-base" data-testid="modal-user-name">{userModal.data.user.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{userModal.data.user.email} &middot; {userModal.data.user.role}</p>
                    {userModal.data.user.title && <p className="text-xs text-muted-foreground">{userModal.data.user.title}</p>}
                  </div>
                </div>
              </DialogHeader>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-primary/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-primary">{userModal.data.sessions.length}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
                <div className="bg-success/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-success">{userModal.data.sessions.filter(s => s.status === 'completed').length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="bg-warning/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-warning">{userModal.data.journeys.length}</p>
                  <p className="text-xs text-muted-foreground">Journeys</p>
                </div>
              </div>

              {/* Feedback Received (for coaches) */}
              {userModal.data.feedback.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-heading font-semibold text-sm text-foreground mb-3">
                    {userModal.data.user.role === 'coach' ? 'Feedback Received' : 'Feedback Given'}
                  </h4>
                  <div className="space-y-2">
                    {userModal.data.feedback.map(fb => (
                      <div key={fb.id} className="p-3 rounded-xl bg-muted/30 border border-border text-xs">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                            <span className="font-bold text-foreground">{fb.overall_rating}/5</span>
                            <span className="text-muted-foreground ml-1">Overall</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                            <span className="font-bold text-foreground">{fb.coach_rating}/5</span>
                            <span className="text-muted-foreground ml-1">Coach</span>
                          </div>
                        </div>
                        {fb.learning_outcomes && (
                          <div className="flex gap-3 mb-2 flex-wrap">
                            {Object.entries(fb.learning_outcomes).map(([key, val]) => (
                              <span key={key} className="text-muted-foreground">
                                {key.replace(/_/g, ' ')}: <strong className="text-foreground">{val}/5</strong>
                              </span>
                            ))}
                          </div>
                        )}
                        {fb.most_valuable && <p className="text-foreground mt-1">"{fb.most_valuable}"</p>}
                        {fb.suggestions && <p className="text-muted-foreground mt-1 italic">Suggestions: {fb.suggestions}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Journey History */}
              {userModal.data.journeys.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-heading font-semibold text-sm text-foreground mb-3">Journey History</h4>
                  <div className="space-y-2">
                    {userModal.data.journeys.map(j => (
                      <div key={j.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{j.mentorship_area || 'Coaching Journey'}</p>
                          <p className="text-xs text-muted-foreground">
                            {userModal.data.user.role === 'coach'
                              ? `Coachee: ${j.coachee_name || 'Unknown'}`
                              : `Coach: ${j.preferences?.find(p => p.status === 'accepted')?.coach_name || 'Unknown'}`}
                          </p>
                        </div>
                        <Badge className={`border-0 text-xs ${
                          j.status === 'completed' ? 'bg-success/10 text-success' :
                          j.status === 'accepted' ? 'bg-primary/10 text-primary' :
                          j.status === 'paused' ? 'bg-warning/10 text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>{j.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session History */}
              {userModal.data.sessions.length > 0 && (
                <div className="mt-5">
                  <h4 className="font-heading font-semibold text-sm text-foreground mb-3">Session History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userModal.data.sessions.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'completed' ? 'bg-success' : s.status === 'upcoming' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{s.topic || 'Session'}</p>
                          <p className="text-xs text-muted-foreground">{s.date} at {s.time}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">{s.coach_name}</p>
                          <Badge variant="outline" className={`text-xs ${s.status === 'completed' ? 'text-success border-success/30' : 'text-primary border-primary/30'}`}>
                            {s.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
