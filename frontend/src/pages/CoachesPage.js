import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import { CoachCard } from '../components/CoachCard';
import CoachFilters from '../components/CoachFilters';
import { GoalsForm, ReviewRequest, RequestStepper } from '../components/RequestWizard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, SlidersHorizontal, X, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const expertiseOptions = [
  'Executive Presence', 'Leadership Development', 'Change Management', 'Risk Assessment',
  'Stakeholder Engagement', 'Process Improvement', 'Project Planning', 'Performance Metrics',
  'Team Communication', 'Feedback Mechanisms', 'Public Speaking',
];

export default function CoachesPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [goals, setGoals] = useState({ mainGoals: '', challenges: '', previousExp: '', notes: '', mentorshipArea: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState(expertiseOptions);
  const [sortBy, setSortBy] = useState('slots');
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.getCoaches().then(c => { setCoaches(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const togglePreference = useCallback((coach) => {
    setSelectedPreferences(prev => {
      const exists = prev.find(p => p.id === coach.id);
      if (exists) return prev.filter(p => p.id !== coach.id);
      if (prev.length >= 3) { toast.error('Maximum 3 preferences allowed'); return prev; }
      return [...prev, coach];
    });
  }, []);

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = !searchQuery ||
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coach.expertise || []).some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesExpertise = selectedExpertise.length === 0 ||
      (coach.expertise || []).some(e => selectedExpertise.includes(e));
    return matchesSearch && matchesExpertise;
  }).sort((a, b) => {
    if (sortBy === 'slots') return (b.slots?.available || 0) - (a.slots?.available || 0);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await api.createRequest({
        preferences: selectedPreferences.map((c, i) => ({ coach_id: c.id, order: i + 1 })),
        goals: goals.mainGoals,
        challenges: goals.challenges,
        previous_exp: goals.previousExp,
        notes: goals.notes,
        mentorship_area: goals.mentorshipArea || selectedPreferences[0]?.expertise?.[0] || 'Coaching',
      });
      setRequestSent(true);
      toast.success('Coaching request sent!');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Coaches" />
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2" data-testid="request-success-title">Request Sent Successfully!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your coaching request has been sent to <strong>{selectedPreferences[0]?.name}</strong>
              {selectedPreferences.length > 1 && ` (and ${selectedPreferences.length - 1} backup preference${selectedPreferences.length > 2 ? 's' : ''})`}.
            </p>
            <div className="bg-accent-subtle border border-accent/30 rounded-xl p-4 text-left mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">What happens next?</p>
              <ul className="space-y-1.5">
                {[
                  `${selectedPreferences[0]?.name} will review your request first`,
                  selectedPreferences.length > 1 ? 'If they decline, your next preference will be notified automatically' : 'You will be notified of their decision',
                  'Once accepted, you can schedule your first session',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => navigate('/')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Coaches" />
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        <RequestStepper currentStep={step} />

        {/* Step 1: Coach Discovery with 3 preferences */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* Search & Sort */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search Coach name, Area of expertise" className="pl-10 h-11 bg-card border-border" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>}
              </div>
              <Button variant="outline" className="h-11 gap-2 px-4" onClick={() => setSortBy(sortBy === 'slots' ? 'name' : 'slots')}>
                <SlidersHorizontal className="w-4 h-4" /> Sort by {sortBy === 'slots' ? 'Slots' : 'Name'}
              </Button>
            </div>

            {/* Preferences bar */}
            {selectedPreferences.length > 0 && (
              <div className="bg-card border border-primary/30 rounded-xl p-4 mb-4 animate-fade-in" data-testid="preferences-bar">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">Your Preferences ({selectedPreferences.length}/3)</p>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs h-8" onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }} data-testid="next-to-goals-btn">
                    Next: Share Goals <ArrowLeft className="w-3.5 h-3.5 ml-1 rotate-180" />
                  </Button>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {selectedPreferences.map((coach, i) => (
                    <div key={coach.id} className="flex items-center gap-2 bg-primary-subtle border border-primary/20 rounded-lg px-3 py-2">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{coach.name}</span>
                      <button onClick={() => togglePreference(coach)} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-6">
              <div className="w-52 flex-shrink-0 hidden md:block">
                <CoachFilters selectedExpertise={selectedExpertise} onExpertiseChange={setSelectedExpertise} />
              </div>
              <div className="flex-1">
                {filteredCoaches.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-foreground font-medium">No coaches found</p>
                    <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedExpertise(expertiseOptions); }}>Clear Filters</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCoaches.map(coach => (
                      <CoachCard
                        key={coach.id}
                        coach={coach}
                        onSelectCoach={togglePreference}
                        isSelected={!!selectedPreferences.find(p => p.id === coach.id)}
                        preferenceNumber={selectedPreferences.findIndex(p => p.id === coach.id) + 1}
                        mode="select"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <GoalsForm goals={goals} onChange={setGoals} onSubmit={() => setStep(3)} onBack={() => setStep(1)} />
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <ReviewRequest
            selectedPreferences={selectedPreferences}
            goals={goals}
            onSend={handleSendRequest}
            onBack={() => setStep(2)}
            sending={sending}
          />
        )}
      </div>
    </div>
  );
}
