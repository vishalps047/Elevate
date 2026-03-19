import { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Users, Calendar, TrendingUp, Star, ChevronRight,
  CheckCircle, XCircle, Clock, AlertTriangle, UserCheck,
  BarChart2, FileText, Download, Eye
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { mockAdminStats, mockPendingCoaches } from '../data/mockData';
import { toast } from 'sonner';

function StatCard({ icon: Icon, value, label, sub, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-subtle text-primary',
    accent: 'bg-accent-subtle text-accent',
    warning: 'bg-yellow-50 text-warning',
    success: 'bg-green-50 text-success',
    destructive: 'bg-red-50 text-destructive',
  };
  return (
    <Card className="shadow-card hover:shadow-md transition-smooth">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-foreground/80 mt-0.5">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs text-success font-medium">{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = [
  'hsl(271 65% 45%)',
  'hsl(181 65% 38%)',
  'hsl(38 92% 50%)',
  'hsl(142 71% 40%)',
  'hsl(0 72% 51%)',
];

export default function AdminDashboard() {
  const [pendingCoaches, setPendingCoaches] = useState(mockPendingCoaches);
  const [reviewingCoach, setReviewingCoach] = useState(null);

  const handleApprove = (id) => {
    setPendingCoaches(prev => prev.filter(c => c.id !== id));
    toast.success('Coach approved successfully!', { description: 'Profile is now active and visible to coachees.' });
    setReviewingCoach(null);
  };
  const handleReject = (id) => {
    setPendingCoaches(prev => prev.filter(c => c.id !== id));
    toast.info('Coach application rejected.');
    setReviewingCoach(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview and management"
      >
        <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10 text-xs h-8 gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Report
        </Button>
      </PageHeader>

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Calendar} value={mockAdminStats.totalSessions} label="Total Sessions" trend="+12% this month" color="primary" />
          <StatCard icon={Users} value={mockAdminStats.activeCoaches} label="Active Coaches" sub="3 pending approval" color="accent" />
          <StatCard icon={UserCheck} value={mockAdminStats.activeCoachees} label="Active Coachees" color="success" />
          <StatCard icon={Clock} value={mockAdminStats.pendingRequests} label="Pending Requests" sub="Awaiting coach action" color="warning" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BarChart2} value={`${mockAdminStats.completionRate}%`} label="Completion Rate" trend="+3% vs last month" color="success" />
          <StatCard icon={Star} value={mockAdminStats.avgRating} label="Avg Session Rating" color="warning" />
          <StatCard icon={TrendingUp} value={mockAdminStats.activeSessions} label="Active Programs" color="primary" />
          <StatCard icon={AlertTriangle} value={pendingCoaches.length} label="Coach Approvals" sub="Need review" color="destructive" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sessions Over Time */}
          <Card className="shadow-card">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Sessions Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockAdminStats.sessionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="sessions" stroke="hsl(271 65% 45%)" strokeWidth={2} dot={{ fill: 'hsl(271 65% 45%)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Request Trends */}
          <Card className="shadow-card">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Request Acceptance Trends</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockAdminStats.requestTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="accepted" fill="hsl(181 65% 38%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="declined" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expertise Distribution */}
          <Card className="shadow-card">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Expertise Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={mockAdminStats.expertiseDistribution}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {mockAdminStats.expertiseDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card className="shadow-card">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-foreground mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mockAdminStats.ratingDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="stars" type="category" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={45} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Coach Approvals */}
        <Card className="shadow-card mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-foreground">Pending Coach Approvals</h3>
                {pendingCoaches.length > 0 && (
                  <Badge className="bg-destructive/10 text-destructive border-0 text-xs">{pendingCoaches.length}</Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary h-7">
                View All <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {pendingCoaches.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-success mx-auto mb-2 opacity-60" />
                <p className="text-sm text-muted-foreground">All coach applications reviewed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCoaches.map(coach => (
                  <div key={coach.id} className="flex items-start gap-3 p-3 border border-border rounded-xl hover:bg-muted/30 transition-fast">
                    <Avatar className="w-11 h-11 flex-shrink-0">
                      <AvatarImage src={coach.avatar} />
                      <AvatarFallback>{coach.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-sm text-foreground">{coach.name}</span>
                        <Badge variant="outline" className="text-xs border-border">{coach.title}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{coach.experience} · {coach.location}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {coach.certifications.map(c => (
                          <span key={c} className="text-xs px-2 py-0.5 bg-primary-subtle text-primary rounded-full">{c}</span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Applied: {coach.submittedAt}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => setReviewingCoach(coach)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Review
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-success text-white hover:bg-success/90"
                        onClick={() => handleApprove(coach.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(coach.id)}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coach Review Modal */}
      {reviewingCoach && (
        <Dialog open={!!reviewingCoach} onOpenChange={() => setReviewingCoach(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Coach Profile Review</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={reviewingCoach.avatar} />
                <AvatarFallback>{reviewingCoach.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-heading font-semibold">{reviewingCoach.name}</h3>
                <p className="text-sm text-muted-foreground">{reviewingCoach.title}</p>
                <p className="text-xs text-muted-foreground">{reviewingCoach.experience} · {reviewingCoach.location}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow label="Email" value={reviewingCoach.email} />
              <InfoRow label="Certifications" value={reviewingCoach.certifications.join(', ')} />
              <InfoRow label="Applied" value={reviewingCoach.submittedAt} />
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Expertise Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {reviewingCoach.expertise.map(e => (
                    <span key={e} className="expertise-tag">{e}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => handleReject(reviewingCoach.id)}
              >
                <XCircle className="w-4 h-4 mr-2" /> Reject
              </Button>
              <Button
                className="bg-success text-white hover:bg-success/90"
                onClick={() => handleApprove(reviewingCoach.id)}
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Approve Coach
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}
