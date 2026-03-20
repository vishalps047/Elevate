import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { CoachCard } from '../components/CoachCard';
import CoachFilters from '../components/CoachFilters';
import { RequestStepper, GoalsForm, ReviewRequest } from '../components/RequestWizard';
import { mockCoaches, expertiseOptions } from '../data/mockData';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, SlidersHorizontal, X, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CoachesPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [goals, setGoals] = useState({ mainGoals: '', challenges: '', previousExp: '', notes: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState(expertiseOptions);
  const [requestSent, setRequestSent] = useState(false);
  const [sortBy, setSortBy] = useState('slots');

  const handleSelectCoach = (coach) => {
    setSelectedCoach(coach);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendRequest = () => {
    setRequestSent(true);
  };

  const filteredCoaches = mockCoaches.filter(coach => {
    const matchesSearch = !searchQuery ||
      coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesExpertise = selectedExpertise.length === 0 ||
      coach.expertise.some(e => selectedExpertise.includes(e));
    return matchesSearch && matchesExpertise;
  }).sort((a, b) => {
    if (sortBy === 'slots') return b.slots.available - a.slots.available;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  if (requestSent) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Coaches" />
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Request Sent Successfully!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your coaching request has been sent to <strong>{selectedCoach?.name}</strong>.
              They'll review your goals and respond within 5 business days.
            </p>
            <div className="bg-accent-subtle border border-accent/30 rounded-xl p-4 text-left mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">What happens next?</p>
              <ul className="space-y-1.5">
                {[
                  `Confirmation email sent to you`,
                  `${selectedCoach?.name} will review your request`,
                  'Once accepted, you can schedule your first session',
                  'You will be notified of their decision'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <span className="w-4 h-4 rounded-full bg-accent text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setStep(1); setRequestSent(false); setSelectedCoach(null); setGoals({ mainGoals: '', challenges: '', previousExp: '', notes: '' }); }}>
                Browse More Coaches
              </Button>
              <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => navigate('/')}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Coaches" />

      <div className="max-w-screen-xl mx-auto px-4 lg:px-8 py-6">
        {/* Stepper */}
        <RequestStepper currentStep={step} />

        {/* Step 1: Coach Discovery */}
        {step === 1 && (
          <div className="animate-fade-in">
            {/* Search & Sort Bar */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Coach name, Area of expertise"
                  className="pl-10 h-11 bg-card border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button variant="outline" className="h-11 gap-2 px-4" onClick={() => setSortBy(sortBy === 'slots' ? 'name' : 'slots')}>
                <SlidersHorizontal className="w-4 h-4" /> Sort by {sortBy === 'slots' ? 'Slots' : 'Name'}
              </Button>
            </div>

            <div className="flex gap-6">
              {/* Filters */}
              <div className="w-52 flex-shrink-0 hidden md:block">
                <CoachFilters
                  selectedExpertise={selectedExpertise}
                  onExpertiseChange={setSelectedExpertise}
                />
              </div>

              {/* Coach Grid */}
              <div className="flex-1">
                {filteredCoaches.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-foreground font-medium">No coaches found</p>
                    <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search query</p>
                    <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedExpertise(expertiseOptions); }}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredCoaches.map(coach => (
                      <CoachCard
                        key={coach.id}
                        coach={coach}
                        onSelectCoach={handleSelectCoach}
                        isSelected={selectedCoach?.id === coach.id}
                        mode="select"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goals Form */}
        {step === 2 && (
          <GoalsForm
            goals={goals}
            onChange={setGoals}
            onSubmit={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {/* Step 3: Review & Send */}
        {step === 3 && selectedCoach && (
          <ReviewRequest
            selectedCoach={selectedCoach}
            goals={goals}
            onSend={handleSendRequest}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
