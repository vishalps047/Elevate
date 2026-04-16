import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['hsl(271, 65%, 28%)', 'hsl(142, 71%, 42%)', 'hsl(35, 92%, 55%)', 'hsl(352, 83%, 55%)', 'hsl(200, 65%, 50%)', 'hsl(280, 50%, 55%)'];
const CHART_TICK = { fontSize: 11 };
const CHART_TOOLTIP = { borderRadius: '8px', fontSize: '12px' };
const CHART_LEGEND = { fontSize: '11px' };
const BAR_RADIUS = [4, 4, 0, 0];

export default function AdminMIS({ mis, onDrillDown }) {
  if (!mis) return null;

  return (
    <div className="space-y-6">
      {/* Coach Occupancy Table */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Coach Occupancy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Coach</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Designation</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Location</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">BU</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Capacity</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Assigned</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {mis.coach_occupancy.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => onDrillDown(c.id)}>
                    <td className="py-2.5 px-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.designation}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.location}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.business_unit}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{c.capacity}</td>
                    <td className="py-2.5 px-3 text-center"><Badge className="bg-primary/10 text-primary border-0 text-xs">{c.assigned}</Badge></td>
                    <td className="py-2.5 px-3 text-center"><Badge className={`border-0 text-xs ${c.remaining > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{c.remaining}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coachee Status Table */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Coachee Status Report</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Coachee</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Designation</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Location</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">BU</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Tier</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Enrolment</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Assigned Coach</th>
                  <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Sessions</th>
                  <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mis.coachee_statuses.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => onDrillDown(c.id)}>
                    <td className="py-2.5 px-3 font-medium text-foreground">{c.name}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.designation}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.location}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.business_unit}</td>
                    <td className="py-2.5 px-3"><Badge variant="outline" className="text-xs">{c.tier}</Badge></td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.enrolment_type}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{c.assigned_coach || '-'}</td>
                    <td className="py-2.5 px-3 text-center font-medium">{c.sessions_completed}</td>
                    <td className="py-2.5 px-3"><Badge className={`border-0 text-xs ${
                      c.coaching_status === 'Undergoing Coaching' ? 'bg-success/10 text-success' :
                      c.coaching_status === 'Completed' ? 'bg-primary/10 text-primary' :
                      c.coaching_status === 'Paused' ? 'bg-warning/10 text-warning' :
                      c.coaching_status === 'Pending Assignment' ? 'bg-accent/10 text-accent' :
                      'bg-muted text-muted-foreground'
                    }`}>{c.coaching_status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Distribution */}
        <Card className="shadow-card">
          <CardContent className="p-5">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Location Distribution</h3>
            {mis.location_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mis.location_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="location" tick={CHART_TICK} />
                  <YAxis tick={CHART_TICK} />
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Legend wrapperStyle={CHART_LEGEND} />
                  <Bar dataKey="coaches" fill="hsl(271, 65%, 28%)" name="Coaches" radius={BAR_RADIUS} />
                  <Bar dataKey="coachees" fill="hsl(142, 71%, 42%)" name="Coachees" radius={BAR_RADIUS} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No location data</div>}
          </CardContent>
        </Card>

        {/* Business Unit Distribution */}
        <Card className="shadow-card">
          <CardContent className="p-5">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Business Unit Distribution</h3>
            {mis.business_unit_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={mis.business_unit_distribution} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name.length > 15 ? name.substring(0,15)+'...' : name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {mis.business_unit_distribution.map((entry, i) => <Cell key={entry.name || i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">No BU data</div>}
          </CardContent>
        </Card>

        {/* Nomination Breakdown */}
        {mis.nomination_breakdown?.length > 0 && (
          <Card className="shadow-card">
            <CardContent className="p-5">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Nomination Type Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={mis.nomination_breakdown} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="count" nameKey="type"
                    label={({ type, percent }) => `${type} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {mis.nomination_breakdown.map((entry, i) => <Cell key={entry.type || i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
