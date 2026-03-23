import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, ArrowLeft, Send, Check, ChevronRight, Info } from 'lucide-react';

const steps = [
  { num: 1, label: 'Choose Coaches' },
  { num: 2, label: 'Share Goals' },
  { num: 3, label: 'Review & Send' },
];

export function RequestStepper({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-smooth ${
            currentStep === step.num ? 'bg-primary text-white shadow-sm' :
            currentStep > step.num ? 'bg-primary-subtle text-primary' :
            'bg-muted text-muted-foreground'
          }`}>
            {currentStep > step.num ? <Check className="w-3 h-3" /> : <span className="w-4 text-center">{step.num}</span>}
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 rounded-full transition-smooth ${currentStep > step.num ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );
}

export function GoalsForm({ goals, onChange, onSubmit, onBack }) {
  const update = (field, value) => onChange({ ...goals, [field]: value });
  const isValid = goals.mainGoals.trim().length > 0 && goals.challenges.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-1">Share Your Goals</h2>
          <p className="text-sm text-muted-foreground mb-6">Help your coach understand what you want to achieve.</p>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Mentorship Area <span className="text-destructive">*</span></label>
              <input className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g., Leadership Development" value={goals.mentorshipArea} onChange={e => update('mentorshipArea', e.target.value)} data-testid="goals-mentorship" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Key Goals <span className="text-destructive">*</span></label>
              <textarea className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="What do you hope to achieve through coaching?" value={goals.mainGoals} onChange={e => update('mainGoals', e.target.value)} data-testid="goals-main" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Current Challenges <span className="text-destructive">*</span></label>
              <textarea className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="What challenges are you facing?" value={goals.challenges} onChange={e => update('challenges', e.target.value)} data-testid="goals-challenges" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Previous Coaching Experience</label>
              <textarea className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Any prior coaching or mentoring experience? (Optional)" value={goals.previousExp} onChange={e => update('previousExp', e.target.value)} data-testid="goals-prev-exp" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Additional Notes</label>
              <textarea className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Anything else you want your coach to know? (Optional)" value={goals.notes} onChange={e => update('notes', e.target.value)} data-testid="goals-notes" />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <Button className="bg-primary text-white hover:bg-primary/90" disabled={!isValid} onClick={onSubmit} data-testid="goals-next-btn">
              Review & Send <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReviewRequest({ selectedPreferences, goals, onSend, onBack, sending }) {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Card className="shadow-card">
        <CardContent className="p-6">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-5">Review Your Request</h2>

          {/* Coach Preferences */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Coach Preferences (in order)</h3>
            <div className="space-y-2">
              {selectedPreferences.map((coach, i) => (
                <div key={coach.id} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 border border-border" data-testid={`review-pref-${i+1}`}>
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={coach.avatar} />
                    <AvatarFallback className="bg-primary-light text-white text-xs">{coach.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{coach.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {coach.location}</p>
                  </div>
                  {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-subtle text-primary font-medium">First Choice</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Goals Summary */}
          <div className="border-t border-border pt-4 mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Goals Summary</h3>
            {[
              { label: 'Mentorship Area', value: goals.mentorshipArea },
              { label: 'Key Goals', value: goals.mainGoals },
              { label: 'Challenges', value: goals.challenges },
              { label: 'Previous Experience', value: goals.previousExp },
              { label: 'Notes', value: goals.notes },
            ].filter(r => r.value).map(row => (
              <div key={row.label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground/70 mb-0.5">{row.label}</p>
                <p className="text-sm text-foreground">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-accent-subtle border border-accent/30 rounded-xl p-3 flex items-start gap-2 mb-6">
            <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              Your request will first go to your <strong>1st preference</strong> coach. If they decline, it will automatically cascade to the next preference.
            </p>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={onSend} disabled={sending} data-testid="send-request-btn">
              {sending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Request</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
