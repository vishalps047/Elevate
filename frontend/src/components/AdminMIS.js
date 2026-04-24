import { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Table2, BarChart3, Users, Award, Briefcase } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['hsl(271,65%,28%)', 'hsl(142,71%,42%)', 'hsl(35,92%,55%)', 'hsl(352,83%,55%)', 'hsl(200,65%,50%)', 'hsl(280,50%,55%)', 'hsl(16,85%,55%)', 'hsl(170,60%,40%)'];
const TICK = { fontSize: 11 };
const TT = { borderRadius: '8px', fontSize: '12px' };
const RADIUS = [4, 4, 0, 0];
const PAGE_SIZE = 15;

const COACH_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'tier', label: 'Tier' },
  { key: 'designation', label: 'Designation' },
  { key: 'location', label: 'Location' },
  { key: 'region', label: 'Region' },
  { key: 'business_unit', label: 'Business Unit' },
  { key: 'competency', label: 'Competency' },
  { key: 'total_work_experience', label: 'Experience (Yrs)' },
  { key: 'coaching_expertise', label: 'Coaching Capacity' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'expertise_areas', label: 'Expertise Areas' },
  { key: 'domains', label: 'Domains' },
  { key: 'employee_status', label: 'Employee Status' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'remaining', label: 'Available' },
  { key: 'total_sessions', label: 'Sessions' },
];

const COACHEE_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'tier', label: 'Tier' },
  { key: 'designation', label: 'Designation' },
  { key: 'location', label: 'Location' },
  { key: 'region', label: 'Region' },
  { key: 'business_unit', label: 'Business Unit' },
  { key: 'competency', label: 'Competency' },
  { key: 'date_of_joining', label: 'Date of Joining' },
  { key: 'enrolment_type', label: 'Enrolment Type' },
  { key: 'employee_status', label: 'Employee Status' },
  { key: 'coaching_status', label: 'Coaching Status' },
  { key: 'assigned_coach', label: 'Assigned Coach' },
  { key: 'sessions_completed', label: 'Sessions Done' },
  { key: 'mentorship_area', label: 'Focus Area' },
];

const OCCUPANCY_COLS = [
  { key: 'name', label: 'Coach Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'location', label: 'Location' },
  { key: 'region', label: 'Region' },
  { key: 'gender', label: 'Gender' },
  { key: 'tier', label: 'Tier' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'remaining', label: 'Available' },
  { key: 'completed_journeys', label: 'Completed' },
  { key: 'total_sessions', label: 'Total Sessions' },
  { key: 'employee_status', label: 'Status' },
];

function downloadCSV(data, columns, filename) {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => {
    const val = String(row[c.key] ?? '').replace(/,/g, ';').replace(/"/g, '""');
    return `"${val}"`;
  }).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DataTable({ data, columns, title, filename }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row => columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(q)));
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const statusColor = (val) => {
    if (!val) return '';
    const v = String(val).toLowerCase();
    if (v === 'completed' || v === 'active') return 'bg-success/10 text-success';
    if (v === 'in progress' || v === 'accepted') return 'bg-primary/10 text-primary';
    if (v === 'paused' || v === 'serving notice period') return 'bg-warning/10 text-warning';
    if (v === 'not started' || v === 'pending assignment') return 'bg-muted text-muted-foreground';
    return '';
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="font-heading font-semibold text-sm text-foreground">{title} ({sorted.length})</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="pl-8 h-8 text-xs w-48"
                data-testid={`mis-search-${filename}`}
              />
            </div>
            <Button
              variant="outline" size="sm" className="h-8 text-xs gap-1.5"
              onClick={() => downloadCSV(sorted, columns, filename)}
              data-testid={`mis-download-${filename}`}
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="text-left py-2 px-2.5 font-semibold text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      {sortKey === col.key && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-8 text-muted-foreground">No data found</td></tr>
              ) : paged.map((row, i) => (
                <tr key={row.id || i} className="border-t border-border/50 hover:bg-muted/20">
                  {columns.map(col => {
                    const val = row[col.key];
                    const isStatus = col.key === 'coaching_status' || col.key === 'employee_status';
                    return (
                      <td key={col.key} className="py-2 px-2.5 whitespace-nowrap max-w-[200px] truncate">
                        {isStatus ? (
                          <Badge className={`border-0 text-[10px] ${statusColor(val)}`}>{val || '-'}</Badge>
                        ) : (
                          <span className="text-foreground/80" title={String(val ?? '')}>{val || '-'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                return (
                  <Button
                    key={pg} variant={pg === page ? 'default' : 'outline'} size="sm"
                    className={`h-7 w-7 p-0 text-xs ${pg === page ? 'bg-primary text-white' : ''}`}
                    onClick={() => setPage(pg)}
                  >
                    {pg + 1}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <h3 className="font-heading font-semibold text-xs text-foreground mb-3">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AdminMIS({ mis }) {
  const [subTab, setSubTab] = useState('charts');

  if (!mis) return null;

  const charts = mis.charts || {};
  const coachDetails = mis.coach_details || [];
  const coacheeDetails = mis.coachee_details || [];

  const SUB_TABS = [
    { key: 'charts', label: 'Analytics', icon: BarChart3 },
    { key: 'coaches', label: `Coach Details (${coachDetails.length})`, icon: Award },
    { key: 'coachees', label: `Coachee Details (${coacheeDetails.length})`, icon: Users },
    { key: 'occupancy', label: 'Coach Occupancy', icon: Briefcase },
  ];

  return (
    <div className="space-y-4" data-testid="admin-mis">
      {/* Sub-tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map(t => (
          <Button
            key={t.key}
            variant={subTab === t.key ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-8 gap-1.5 ${subTab === t.key ? 'bg-primary text-white' : ''}`}
            onClick={() => setSubTab(t.key)}
            data-testid={`mis-tab-${t.key}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </Button>
        ))}
      </div>

      {/* Charts Tab */}
      {subTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* 1. Coaching Status Donut */}
          <ChartCard title="Coaching Status Breakdown">
            {charts.coaching_status?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.coaching_status} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {charts.coaching_status.map((e, i) => <Cell key={e.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 2. Coaches by Region */}
          <ChartCard title="Coaches by Region">
            {charts.coaches_by_region?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.coaches_by_region}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="region" tick={TICK} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" fill="hsl(271,65%,28%)" radius={RADIUS} name="Coaches" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 3. Coachees by BU */}
          <ChartCard title="Coachees by Business Unit">
            {charts.coachees_by_bu?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.coachees_by_bu} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={TICK} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={TICK} width={100} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" fill="hsl(142,71%,42%)" radius={[0,4,4,0]} name="Coachees" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 4. Gender Distribution */}
          <ChartCard title="Gender Distribution">
            {charts.gender_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.gender_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="gender" tick={TICK} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="coaches" fill="hsl(271,65%,28%)" radius={RADIUS} name="Coaches" />
                  <Bar dataKey="coachees" fill="hsl(200,65%,50%)" radius={RADIUS} name="Coachees" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 5. Capacity by Tier */}
          <ChartCard title="Coach Capacity by Tier">
            {charts.capacity_by_tier?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.capacity_by_tier}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="tier" tick={TICK} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="capacity" fill="hsl(271,65%,28%)" radius={RADIUS} name="Capacity" />
                  <Bar dataKey="assigned" fill="hsl(35,92%,55%)" radius={RADIUS} name="Assigned" />
                  <Bar dataKey="available" fill="hsl(142,71%,42%)" radius={RADIUS} name="Available" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 6. Top Coaches */}
          <ChartCard title="Top Coaches by Coachees Assigned">
            {charts.top_coaches?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.top_coaches}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={TICK} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="assigned" fill="hsl(271,65%,28%)" radius={RADIUS} name="Assigned" />
                  <Bar dataKey="completed" fill="hsl(142,71%,42%)" radius={RADIUS} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 7. Nomination Split */}
          <ChartCard title="Nomination Type Split">
            {charts.nomination_split?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.nomination_split} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name.length > 12 ? name.substring(0,12)+'..' : name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {charts.nomination_split.map((e, i) => <Cell key={e.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 8. Sessions Bucket */}
          <ChartCard title="Coachees by Sessions Completed">
            {charts.sessions_bucket?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.sessions_bucket}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bucket" tick={TICK} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" fill="hsl(352,83%,55%)" radius={RADIUS} name="Coachees" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>

          {/* 9. Employee Status */}
          <ChartCard title="Employee Status (All)">
            {charts.employee_status?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.employee_status} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {charts.employee_status.map((e, i) => <Cell key={e.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
          </ChartCard>
        </div>
      )}

      {/* Coach Details Tab */}
      {subTab === 'coaches' && (
        <DataTable data={coachDetails} columns={COACH_COLS} title="Coach Details" filename="coach_details" />
      )}

      {/* Coachee Details Tab */}
      {subTab === 'coachees' && (
        <DataTable data={coacheeDetails} columns={COACHEE_COLS} title="Coachee Details" filename="coachee_details" />
      )}

      {/* Coach Occupancy Tab */}
      {subTab === 'occupancy' && (
        <DataTable data={coachDetails} columns={OCCUPANCY_COLS} title="Coach Occupancy" filename="coach_occupancy" />
      )}
    </div>
  );
}
