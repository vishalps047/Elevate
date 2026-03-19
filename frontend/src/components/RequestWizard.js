import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Send, User, Target, FileText, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';

const steps = [
  { id: 1, label: 'Choose your Coach', icon: User },
  { id: 2, label: 'Share your Goals', icon: Target },
  { id: 3, label: 'Review and Submit Request', icon: FileText },
];

export function RequestStepper({ currentStep }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-xs">
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-smooth ${
                  isCompleted ? 'bg-accent text-white' :
                  isActive ? 'bg-primary text-white shadow-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Step {step.id}</p>
                  <p className={`text-xs font-medium ${
                    isActive ? 'text-primary font-semibold' :
                    isCompleted ? 'text-accent' :
                    'text-muted-foreground'
                  }`}>{step.label}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-3">
                  <div className="h-0.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-smooth step-line-active`}
                      style={{ width: currentStep > step.id ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GoalsForm({ goals, onChange, onSubmit, onBack }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!goals.mainGoals?.trim()) errs.mainGoals = 'This field is required';
    if (!goals.challenges?.trim()) errs.challenges = 'This field is required';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card animate-fade-in">
      <h2 className="font-heading font-semibold text-lg text-foreground mb-6">Share Your Goals</h2>

      <div className="space-y-5">
        {/* Q1 */}
        <div className="border border-border rounded-xl p-4">
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Q1. What are your main coaching goals? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Describe what you hope to achieve through coaching (e.g., improve leadership skills, enhance communication, career advancement...)"
            className={`resize-none text-sm min-h-[80px] border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent ${errors.mainGoals ? 'placeholder:text-destructive' : ''}`}
            value={goals.mainGoals || ''}
            onChange={(e) => { onChange({ ...goals, mainGoals: e.target.value }); setErrors(p => ({...p, mainGoals: null})); }}
          />
          {errors.mainGoals && <p className="text-xs text-destructive mt-1">{errors.mainGoals}</p>}
        </div>

        {/* Q2 */}
        <div className="border border-border rounded-xl p-4">
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Q2. What are your current challenges? <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Share specific challenges you're facing that coaching could help address (e.g., difficult team dynamics, presentation anxiety, strategic thinking...)"
            className={`resize-none text-sm min-h-[80px] border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent ${errors.challenges ? 'placeholder:text-destructive' : ''}`}
            value={goals.challenges || ''}
            onChange={(e) => { onChange({ ...goals, challenges: e.target.value }); setErrors(p => ({...p, challenges: null})); }}
          />
          {errors.challenges && <p className="text-xs text-destructive mt-1">{errors.challenges}</p>}
        </div>

        {/* Q3 */}
        <div className="border border-border rounded-xl p-4">
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Q3. Previous coaching or training experience. (If any)
          </Label>
          <Textarea
            placeholder="Describe any previous coaching, training, or development programs you've participated in"
            className="resize-none text-sm min-h-[80px] border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent"
            value={goals.previousExp || ''}
            onChange={(e) => onChange({ ...goals, previousExp: e.target.value })}
          />
        </div>

        {/* Additional notes */}
        <div className="border border-border rounded-xl p-4">
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Additional notes (optional)
          </Label>
          <Textarea
            placeholder="Any additional information that would help your coach understand your needs better"
            className="resize-none text-sm min-h-[80px] border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent"
            value={goals.notes || ''}
            onChange={(e) => onChange({ ...goals, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Go Back
        </Button>
        <Button
          className="bg-primary-light hover:bg-primary text-white px-6"
          onClick={handleSubmit}
        >
          Submit & Continue <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export function ReviewRequest({ selectedCoach, goals, onSend, onBack }) {
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      onSend();
      toast.success('Coaching request sent successfully!', {
        description: `Your request has been sent to ${selectedCoach.name}. You'll be notified when they respond.`
      });
    }, 1200);
  };

  const GoalBox = ({ question, answer }) => (
    <div className="border border-border rounded-xl p-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">{question}</p>
      <p className="text-sm text-primary font-medium">{answer || <span className="text-muted-foreground italic">Not provided</span>}</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="font-heading font-semibold text-lg text-foreground">Review and Send Request</h2>
        <p className="text-sm text-muted-foreground mt-1">Please review your coaching request before sending</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coach Panel */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Coach Selected</p>
          <Avatar className="w-14 h-14 mb-3 ring-2 ring-primary/30">
            <AvatarImage src={selectedCoach.avatar} />
            <AvatarFallback>{selectedCoach.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
          </Avatar>
          <h3 className="font-heading font-semibold text-foreground">{selectedCoach.name}</h3>
          <Badge variant="outline" className="text-xs mt-1 border-primary/40 text-primary">{selectedCoach.title}</Badge>
          <p className="text-xs text-muted-foreground mt-1">★ {selectedCoach.rating} • {selectedCoach.location}</p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">About</p>
            <p className="text-xs text-foreground/70 leading-relaxed">{selectedCoach.about}</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Area of Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedCoach.expertise.slice(0, 3).map(e => (
                <span key={e} className="expertise-tag">{e}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Goals Panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Your Goals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GoalBox question="Q1. What are your main coaching goals? *" answer={goals.mainGoals} />
            <GoalBox question="Q2. What are your current challenges?" answer={goals.challenges} />
            <GoalBox question="Q3. Previous coaching or training experience. (If any)" answer={goals.previousExp} />
            <GoalBox question="Additional notes (optional)" answer={goals.notes} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-5">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Edit Details
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-white px-6 shadow-primary"
          onClick={handleSend}
          disabled={sending}
        >
          {sending ? (
            <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Send Coaching Request →</>
          )}
        </Button>
      </div>
    </div>
  );
}
