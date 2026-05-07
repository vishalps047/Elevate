import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Download, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, BarChart3, Users, Award, Briefcase, Filter, X, Check, MessageSquare, Star, Send, FileText } from 'lucide-react';
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
  { key: 'gender', label: 'Gender', filterable: true },
  { key: 'tier', label: 'Tier', filterable: true },
  { key: 'designation', label: 'Designation', filterable: true },
  { key: 'location', label: 'Location', filterable: true },
  { key: 'region', label: 'Region', filterable: true },
  { key: 'business_unit', label: 'Business Unit', filterable: true },
  { key: 'competency', label: 'Competency', filterable: true },
  { key: 'total_work_experience', label: 'Experience (Yrs)' },
  { key: 'coaching_expertise', label: 'Coaching Capacity' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'expertise_areas', label: 'Expertise Areas' },
  { key: 'domains', label: 'Domains' },
  { key: 'employee_status', label: 'Employee Status', filterable: true },
  { key: 'assigned', label: 'Assigned' },
  { key: 'remaining', label: 'Available' },
  { key: 'total_sessions', label: 'Sessions' },
];

const COACHEE_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender', filterable: true },
  { key: 'tier', label: 'Tier', filterable: true },
  { key: 'designation', label: 'Designation', filterable: true },
  { key: 'location', label: 'Location', filterable: true },
  { key: 'region', label: 'Region', filterable: true },
  { key: 'business_unit', label: 'Business Unit', filterable: true },
  { key: 'competency', label: 'Competency', filterable: true },
  { key: 'date_of_joining', label: 'Date of Joining' },
  { key: 'enrolment_type', label: 'Enrolment Type', filterable: true },
  { key: 'employee_status', label: 'Employee Status', filterable: true },
  { key: 'coaching_status', label: 'Coaching Status', filterable: true },
  { key: 'assigned_coach', label: 'Assigned Coach', filterable: true },
  { key: 'sessions_completed', label: 'Sessions Done' },
  { key: 'mentorship_area', label: 'Focus Area', filterable: true },
];

const OCCUPANCY_COLS = [
  { key: 'name', label: 'Coach Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'location', label: 'Location', filterable: true },
  { key: 'region', label: 'Region', filterable: true },
  { key: 'gender', label: 'Gender', filterable: true },
  { key: 'tier', label: 'Tier', filterable: true },
  { key: 'capacity', label: 'Capacity' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'remaining', label: 'Available' },
  { key: 'completed_journeys', label: 'Completed' },
  { key: 'total_sessions', label: 'Total Sessions' },
  { key: 'employee_status', label: 'Status', filterable: true },
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

/* Excel-style filter dropdown */
function ColumnFilter({ columnKey, data, activeFilters, onApply, onClose }) {
  const ref = useRef(null);
  const [filterSearch, setFilterSearch] = useState('');
  const allValues = useMemo(() => {
    const vals = new Set();
    data.forEach(row => {
      const v = String(row[columnKey] ?? '').trim();
      if (v) vals.add(v);
    });
    return Array.from(vals).sort();
  }, [data, columnKey]);

  const current = activeFilters[columnKey] || [];
  const [selected, setSelected] = useState(() => current.length > 0 ? new Set(current) : new Set(allValues));

  const filtered = filterSearch
    ? allValues.filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()))
    : allValues;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const toggleAll = () => {
    if (selected.size === allValues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allValues));
    }
  };

  const toggle = (val) => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setSelected(next);
  };

  const apply = () => {
    if (selected.size === allValues.length) {
      // All selected = no filter
      onApply(columnKey, []);
    } else {
      onApply(columnKey, Array.from(selected));
    }
    onClose();
  };

  const clear = () => {
    onApply(columnKey, []);
    onClose();
  };

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-52 bg-card rounded-lg shadow-lg border border-border z-50 animate-fade-in" data-testid={`col-filter-${columnKey}`}>
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40"
            autoFocus
          />
        </div>
      </div>
      <div className="p-1 border-b border-border">
        <button onClick={toggleAll} className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted/50">
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selected.size === allValues.length ? 'bg-primary border-primary' : 'border-border'}`}>
            {selected.size === allValues.length && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
          <span className="font-medium">(Select All)</span>
        </button>
      </div>
      <div className="max-h-44 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No matches</p>
        ) : filtered.map(val => (
          <button
            key={val}
            onClick={() => toggle(val)}
            className="w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-muted/50"
          >
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${selected.has(val) ? 'bg-primary border-primary' : 'border-border'}`}>
              {selected.has(val) && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className="truncate text-left">{val}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 p-2 border-t border-border">
        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={clear}>Clear</Button>
        <Button size="sm" className="flex-1 h-7 text-xs bg-primary text-white" onClick={apply}>Apply</Button>
      </div>
    </div>
  );
}

function DataTable({ data, columns, title, filename }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [colFilters, setColFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);

  const activeFilterCount = Object.values(colFilters).filter(v => v.length > 0).length;

  const filtered = useMemo(() => {
    let result = data;
    // Apply column filters
    for (const [key, vals] of Object.entries(colFilters)) {
      if (vals.length > 0) {
        const set = new Set(vals);
        result = result.filter(row => set.has(String(row[key] ?? '').trim()));
      }
    }
    // Apply text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row => columns.some(c => String(row[c.key] ?? '').toLowerCase().includes(q)));
    }
    return result;
  }, [data, search, columns, colFilters]);

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
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const handleFilterApply = (key, vals) => {
    setColFilters(prev => ({ ...prev, [key]: vals }));
    setPage(0);
  };

  const clearAllFilters = () => {
    setColFilters({});
    setSearch('');
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
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold text-sm text-foreground">{title} ({sorted.length})</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20">
                <Filter className="w-2.5 h-2.5" /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
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
                  <th key={col.key} className="text-left py-2 px-2.5 font-semibold text-muted-foreground whitespace-nowrap select-none">
                    <div className="flex items-center gap-1">
                      <span
                        className="cursor-pointer hover:text-foreground inline-flex items-center gap-0.5"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                        {sortKey === col.key && (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                      {col.filterable && (
                        <div className="relative">
                          <button
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                              colFilters[col.key]?.length > 0 ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={(e) => { e.stopPropagation(); setOpenFilter(openFilter === col.key ? null : col.key); }}
                            data-testid={`filter-btn-${col.key}`}
                          >
                            <Filter className="w-2.5 h-2.5" />
                          </button>
                          {openFilter === col.key && (
                            <ColumnFilter
                              columnKey={col.key}
                              data={data}
                              activeFilters={colFilters}
                              onApply={handleFilterApply}
                              onClose={() => setOpenFilter(null)}
                            />
                          )}
                        </div>
                      )}
                    </div>
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

function RatingBar({ data, average, title, color }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-xs text-foreground">{title}</h3>
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-primary text-primary" />
            <span className="text-xs font-bold text-primary">{average}/5</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="rating" tick={TICK} />
            <YAxis tick={TICK} allowDecimals={false} />
            <Tooltip contentStyle={TT} formatter={(v) => [`${v} responses`, 'Count']} />
            <Bar dataKey="count" fill={color} radius={RADIUS} name="Responses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function FeedbackTab({ feedback }) {
  if (!feedback) return <p className="text-sm text-muted-foreground text-center py-8">No feedback data available</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><Send className="w-4 h-4 text-primary" /><span className="text-2xl font-bold text-foreground">{feedback.total_sent}</span></div>
          <p className="text-xs text-muted-foreground">Feedback Forms Sent</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><FileText className="w-4 h-4 text-success" /><span className="text-2xl font-bold text-foreground">{feedback.total_responses}</span></div>
          <p className="text-xs text-muted-foreground">Responses Received</p>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-warning" /><span className="text-2xl font-bold text-foreground">{feedback.response_rate}%</span></div>
          <p className="text-xs text-muted-foreground">Response Rate</p>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RatingBar data={feedback.overall_experience?.distribution || []} average={feedback.overall_experience?.average || 0} title="Overall Experience" color="hsl(271,65%,28%)" />
        <RatingBar data={feedback.coach_knowledge?.distribution || []} average={feedback.coach_knowledge?.average || 0} title="Coach Knowledge, Guidance & Engagement" color="hsl(142,71%,42%)" />
        <RatingBar data={feedback.learning_effectiveness?.distribution || []} average={feedback.learning_effectiveness?.average || 0} title="Learning Journey Effectiveness" color="hsl(200,65%,50%)" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card"><CardContent className="p-4">
          <h3 className="font-heading font-semibold text-xs text-foreground mb-3 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning" /> What coachees found most valuable</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {feedback.most_valuable?.length > 0 ? feedback.most_valuable.map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-foreground/85 leading-relaxed italic">"{item.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">— {item.name}</p>
              </div>
            )) : <p className="text-xs text-muted-foreground text-center py-4">No responses yet</p>}
          </div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4">
          <h3 className="font-heading font-semibold text-xs text-foreground mb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-primary" /> Suggestions & Recommendations</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {feedback.suggestions?.length > 0 ? feedback.suggestions.map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-xs text-foreground/85 leading-relaxed italic">"{item.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">— {item.name}</p>
              </div>
            )) : <p className="text-xs text-muted-foreground text-center py-4">No suggestions yet</p>}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

export default function AdminMIS({ mis }) {
  const [subTab, setSubTab] = useState('charts');

  if (!mis) return null;

  const charts = mis.charts || {};
  const coachDetails = mis.coach_details || [];
  const coacheeDetails = mis.coachee_details || [];
  const feedback = mis.feedback || null;

  const SUB_TABS = [
    { key: 'charts', label: 'Analytics', icon: BarChart3 },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare },
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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

          <ChartCard title="Registered Coaches: Occupied vs Not Occupied by BU">
            {charts.coach_occupancy_bu?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.coach_occupancy_bu}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="bu" tick={TICK} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="occupied" stackId="a" fill="hsl(271,65%,28%)" name="Occupied" />
                  <Bar dataKey="not_occupied" stackId="a" fill="hsl(0,0%,82%)" radius={[4,4,0,0]} name="Not Occupied" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

          <ChartCard title="Active Coaches by Designation">
            {charts.coaches_by_designation?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.coaches_by_designation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="designation" tick={TICK} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" fill="hsl(35,92%,55%)" radius={RADIUS} name="Coaches" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

          <ChartCard title="Active Coachees by Designation">
            {charts.coachees_by_designation?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.coachees_by_designation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="designation" tick={TICK} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TT} />
                  <Bar dataKey="count" fill="hsl(200,65%,50%)" radius={RADIUS} name="Coachees" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>

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
            ) : <p className="h-52 flex items-center justify-center text-xs text-muted-foreground">No data</p>}
          </ChartCard>
        </div>
      )}

      {/* Feedback Tab */}
      {subTab === 'feedback' && <FeedbackTab feedback={feedback} />}

      {subTab === 'coaches' && (
        <DataTable data={coachDetails} columns={COACH_COLS} title="Coach Details" filename="coach_details" />
      )}

      {subTab === 'coachees' && (
        <DataTable data={coacheeDetails} columns={COACHEE_COLS} title="Coachee Details" filename="coachee_details" />
      )}

      {subTab === 'occupancy' && (
        <DataTable data={coachDetails} columns={OCCUPANCY_COLS} title="Coach Occupancy" filename="coach_occupancy" />
      )}
    </div>
  );
}
