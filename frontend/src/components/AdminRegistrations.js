import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Award, Users, Check, X, ClipboardList } from 'lucide-react';

export default function AdminRegistrations({ registrations, regFilter, setRegFilter, onApprove, onReject }) {
  const filtered = registrations.filter(r => regFilter === 'all' || r.status === regFilter);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <Button key={f} size="sm" variant={regFilter === f ? 'default' : 'outline'} className={`text-xs h-8 capitalize ${regFilter === f ? 'bg-primary text-white' : ''}`} onClick={() => setRegFilter(f)} data-testid={`reg-filter-${f}`}>
            {f} {f === 'pending' && registrations.filter(r => r.status === 'pending').length > 0 && <Badge className="ml-1 bg-warning/20 text-warning border-0 text-xs">{registrations.filter(r => r.status === 'pending').length}</Badge>}
          </Button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(reg => (
          <Card key={reg.id} className="shadow-card" data-testid={`reg-${reg.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${reg.role === 'coach' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {reg.role === 'coach' ? <Award className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{reg.name}</p>
                    <Badge variant="outline" className="text-xs capitalize">{reg.role}</Badge>
                    <Badge className={`text-xs border-0 ${reg.status === 'pending' ? 'bg-warning/10 text-warning' : reg.status === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{reg.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{reg.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {reg.designation && <span className="bg-muted rounded px-2 py-0.5">{reg.designation}</span>}
                    {reg.location && <span className="bg-muted rounded px-2 py-0.5">{reg.location}</span>}
                    {reg.business_unit && <span className="bg-muted rounded px-2 py-0.5">{reg.business_unit}</span>}
                    {reg.tier && <span className="bg-muted rounded px-2 py-0.5">{reg.tier}</span>}
                    {reg.enrolment_type && <span className="bg-primary/10 text-primary rounded px-2 py-0.5">{reg.enrolment_type}</span>}
                  </div>
                  {reg.reason_for_enrolment && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">"{reg.reason_for_enrolment}"</p>}
                  {reg.nominated_by && <p className="text-xs text-muted-foreground mt-1">Nominated by: <strong>{reg.nominated_by}</strong></p>}
                  {reg.nominated_coachees?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-foreground mb-1">Nominated Coachees:</p>
                      <div className="flex flex-wrap gap-1.5">{reg.nominated_coachees.map((n) => <Badge key={n.email} variant="outline" className="text-xs">{n.name} ({n.email})</Badge>)}</div>
                    </div>
                  )}
                </div>
                {reg.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-white text-xs h-8" onClick={() => onApprove(reg.id)} data-testid={`approve-reg-${reg.id}`}>
                      <Check className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-8 text-destructive border-destructive/30" onClick={() => onReject(reg.id)} data-testid={`reject-reg-${reg.id}`}>
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No {regFilter !== 'all' ? regFilter : ''} registrations</p>
          </div>
        )}
      </div>
    </div>
  );
}
