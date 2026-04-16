import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { api } from '../services/api';
import { toast } from 'sonner';
import { UserPlus, GraduationCap, Award, Plus, X, Send } from 'lucide-react';

const LOCATIONS = ['MUM', 'DEL', 'BLR', 'HYD', 'CHN', 'KOL', 'PUN', 'AHM', 'GUR'];
const TIERS = ['T1', 'T2', 'T3', 'T4', 'T5'];
const BUS_UNITS = [
  'Audit & Assurance', 'Tax', 'Advisory', 'ESG & Risk Consulting',
  'Forensic & Investigation', 'Deal Advisory', 'Financial Services',
  'Technology Consulting', 'People & Organisation', 'Business Process Solutions',
];

export default function RegistrationForm({ onClose }) {
  const [role, setRole] = useState('coachee');
  const [form, setForm] = useState({
    name: '', email: '', date_of_joining: '', tier: '', designation: '',
    location: '', business_unit: '', competency: '', co_supercoach: '',
    enrolment_type: 'Self-nomination', reason_for_enrolment: '',
  });
  const [nominees, setNominees] = useState([]);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeEmail, setNomineeEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addNominee = () => {
    if (!nomineeName.trim() || !nomineeEmail.trim()) { toast.error('Enter nominee name and email'); return; }
    setNominees([...nominees, { name: nomineeName.trim(), email: nomineeEmail.trim() }]);
    setNomineeName(''); setNomineeEmail('');
  };

  const removeNominee = (i) => setNominees(nominees.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and Email are required'); return; }
    if (!form.designation.trim()) { toast.error('Designation is required'); return; }
    if (!form.location) { toast.error('Location is required'); return; }
    if (!form.business_unit) { toast.error('Business Unit is required'); return; }
    if (role === 'coachee' && !form.reason_for_enrolment.trim()) { toast.error('Reason for enrolment is required'); return; }

    setSubmitting(true);
    try {
      const payload = { ...form, role };
      if (role === 'coach' && nominees.length > 0) {
        payload.nominated_coachees = nominees;
      }
      await api.submitRegistration(payload);
      toast.success('Registration submitted! An admin will review your request.');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50";
  const selectClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelClass = "text-xs font-semibold text-foreground mb-1 block";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" data-testid="registration-modal">
      <Card className="w-full max-w-lg shadow-xl my-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg text-foreground">Register for ELEVATE</h2>
              <p className="text-xs text-muted-foreground">Join the coaching platform</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" data-testid="close-registration">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Role Toggle */}
          <div className="flex gap-2 mb-5 p-1 bg-muted/50 rounded-lg">
            <button
              type="button"
              onClick={() => setRole('coachee')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-fast flex items-center justify-center gap-1.5 ${role === 'coachee' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid="role-coachee-tab"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Register as Coachee
            </button>
            <button
              type="button"
              onClick={() => setRole('coach')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-fast flex items-center justify-center gap-1.5 ${role === 'coach' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid="role-coach-tab"
            >
              <Award className="w-3.5 h-3.5" /> Register as Coach
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name *</label>
                <input className={inputClass} placeholder="Full name" value={form.name} onChange={e => updateField('name', e.target.value)} data-testid="reg-name" />
              </div>
              <div>
                <label className={labelClass}>Email ID *</label>
                <input type="email" className={inputClass} placeholder="name@company.com" value={form.email} onChange={e => updateField('email', e.target.value)} data-testid="reg-email" />
              </div>
            </div>

            {/* Row 2: DOJ + Tier */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Date of Joining</label>
                <input type="date" className={inputClass} value={form.date_of_joining} onChange={e => updateField('date_of_joining', e.target.value)} data-testid="reg-doj" />
              </div>
              <div>
                <label className={labelClass}>Tier</label>
                <select className={selectClass} value={form.tier} onChange={e => updateField('tier', e.target.value)} data-testid="reg-tier">
                  <option value="">Select tier</option>
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Row 3: Designation + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Designation *</label>
                <input className={inputClass} placeholder="e.g. Manager" value={form.designation} onChange={e => updateField('designation', e.target.value)} data-testid="reg-designation" />
              </div>
              <div>
                <label className={labelClass}>Location *</label>
                <select className={selectClass} value={form.location} onChange={e => updateField('location', e.target.value)} data-testid="reg-location">
                  <option value="">Select location</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Row 4: Business Unit + Competency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Business Unit *</label>
                <select className={selectClass} value={form.business_unit} onChange={e => updateField('business_unit', e.target.value)} data-testid="reg-bu">
                  <option value="">Select unit</option>
                  {BUS_UNITS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Competency</label>
                <input className={inputClass} placeholder="e.g. FS Risk" value={form.competency} onChange={e => updateField('competency', e.target.value)} data-testid="reg-competency" />
              </div>
            </div>

            {/* Coachee-only fields */}
            {role === 'coachee' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Co-SuperCoach</label>
                    <input className={inputClass} placeholder="Supervisor name" value={form.co_supercoach} onChange={e => updateField('co_supercoach', e.target.value)} data-testid="reg-supercoach" />
                  </div>
                  <div>
                    <label className={labelClass}>Enrolment Type</label>
                    <select className={selectClass} value={form.enrolment_type} onChange={e => updateField('enrolment_type', e.target.value)} data-testid="reg-enrolment-type">
                      <option value="Self-nomination">Self-nomination</option>
                      <option value="Coach-nominated">Coach-nominated</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Reason for Enrolment *</label>
                  <textarea
                    className={`${inputClass} min-h-[60px] resize-none`}
                    placeholder="Why do you want to join the ELEVATE program?"
                    value={form.reason_for_enrolment}
                    onChange={e => updateField('reason_for_enrolment', e.target.value)}
                    data-testid="reg-reason"
                  />
                </div>
              </>
            )}

            {/* Coach: Nominate Coachees */}
            {role === 'coach' && (
              <div className="border border-border rounded-lg p-3 bg-muted/30">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-primary" /> Nominate Coachees <span className="text-muted-foreground font-normal">(Optional)</span>
                </p>
                {nominees.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {nominees.map((n, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1 pr-1">
                        {n.name}
                        <button type="button" onClick={() => removeNominee(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input className={`${inputClass} flex-1`} placeholder="Name" value={nomineeName} onChange={e => setNomineeName(e.target.value)} data-testid="nominee-name" />
                  <input type="email" className={`${inputClass} flex-1`} placeholder="Email" value={nomineeEmail} onChange={e => setNomineeEmail(e.target.value)} data-testid="nominee-email" />
                  <Button type="button" size="sm" variant="outline" className="h-9 px-2 flex-shrink-0" onClick={addNominee} data-testid="add-nominee-btn">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={submitting} data-testid="submit-registration-btn">
              {submitting ? 'Submitting...' : <><Send className="w-4 h-4 mr-2" /> Submit Registration</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
