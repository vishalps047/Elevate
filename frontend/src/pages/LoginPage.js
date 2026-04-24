import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, TrendingUp, Award, Users, ChevronRight, Lock, Mail, AlertCircle, Building2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import RegistrationForm from '../components/RegistrationForm';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [publicStats, setPublicStats] = useState(null);
  const [demoLoading, setDemoLoading] = useState('');
  const [demoPicker, setDemoPicker] = useState(null); // 'coach' | 'coachee' | null

  const demoCoaches = [
    { name: 'Fatema Hunaid', email: 'Fatema.Hunaid@in.gt.com', location: 'GUR · People & Culture' },
    { name: 'Triven Gupta', email: 'Triven.Gupta@in.gt.com', location: 'GUR · Global Delivery' },
    { name: 'Archie Mehtani', email: 'Archie.Mehtani@in.gt.com', location: 'DEL · FS Consulting' },
    { name: 'Anup Thomas', email: 'Anup.Thomas@in.gt.com', location: 'BAN · ESG & Risk' },
    { name: 'Sumaiya Shaikh', email: 'Sumaiya.Shaikh@in.gt.com', location: 'MUM · Audit' },
    { name: 'Amit Kumar', email: 'Amit.K@in.gt.com', location: 'HYD · Tax & Regulatory' },
    { name: 'Kapil Arora', email: 'Kapil.Arora@in.gt.com', location: 'BAN · ESG & Risk' },
    { name: 'Gaurav Sahdev', email: 'Gaurav.Sahdev@in.gt.com', location: 'HYD · Private Client' },
    { name: 'Pankaj Arora', email: 'Pankaj.Arora@in.gt.com', location: 'CHN · Tax & Regulatory' },
    { name: 'Armaity Jayakar', email: 'Armaity.Jayakar@in.gt.com', location: 'MUM · Audit' },
  ];

  const demoCoachees = [
    { name: 'Prerna Kapoor', email: 'Prerna.Kapoor@in.gt.com', detail: 'T2 · DEL · Tax & Regulatory' },
    { name: 'Rahul Lalit', email: 'Rahul.Lalit@in.gt.com', detail: 'T2 · MUM · Assurance' },
    { name: 'Pragya Sharma', email: 'Pragya.Sharma@in.gt.com', detail: 'T1 · BAN · ESG & Risk' },
    { name: 'Mohit Khullar', email: 'Mohit.Khullar@in.gt.com', detail: 'T1 · GUR · Advisory' },
    { name: 'Pooja Raina', email: 'Pooja.Raina@in.gt.com', detail: 'T2 · GUR · Global Delivery' },
    { name: 'Pratik Hegde', email: 'Pratik.Hegde@in.gt.com', detail: 'T2 · BAN · Transformation' },
    { name: 'Saurabh Redhu', email: 'Saurabh.Redhu@in.gt.com', detail: 'T2 · DEL · FS Consulting' },
    { name: 'Kamalika Sen Roy', email: 'Kamalika.Roy@in.gt.com', detail: 'T2 · MUM · Audit' },
    { name: 'Hazel Ferreira', email: 'Hazel.Ferreira@in.gt.com', detail: 'T2 · MUM · Cyber & IT Risk' },
    { name: 'Dhaval Sheth', email: 'Dhaval.Sheth@in.gt.com', detail: 'T1 · DEH · BPS' },
  ];

  const handleDemoLogin = async (email) => {
    setError('');
    setDemoLoading(email);
    try {
      await login(email, 'password123');
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading('');
    }
  };

  useEffect(() => {
    api.getPublicStats().then(setPublicStats).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsl(271 65% 15%), hsl(267 55% 28%), hsl(271 45% 22%))' }}
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 max-w-md px-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-white tracking-wide">ELEVATE</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-white leading-tight mb-4">
            Coaching that transforms <br />
            <span className="text-white/70">#Great2Exceptional</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            A personalized coaching platform connecting professionals with certified coaches to accelerate growth, build leadership skills, and go beyond.
          </p>

          {/* Platform stats */}
          {publicStats && (
            <div className="flex gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center" data-testid="stat-coaches">
                <p className="text-xl font-bold text-white">{publicStats.coaches}</p>
                <p className="text-xs text-white/60">Coaches</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center" data-testid="stat-coachees">
                <p className="text-xl font-bold text-white">{publicStats.coachees}</p>
                <p className="text-xs text-white/60">Coachees</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center" data-testid="stat-sessions">
                <p className="text-xl font-bold text-white">{publicStats.sessions_completed}</p>
                <p className="text-xs text-white/60">Sessions</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {[
              { key: 'personalized', icon: TrendingUp, text: '1:1 personalized coaching sessions' },
              { key: 'certified', icon: Award, text: 'Certified internal coaches' },
              { key: 'structured', icon: Users, text: 'Structured learning journeys' },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <item.icon className="w-3.5 h-3.5 text-white/80" />
                </div>
                <span className="text-white/70 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Shield className="w-7 h-7 text-primary" />
            <span className="font-heading font-bold text-xl">ELEVATE</span>
          </div>

          <Card className="shadow-card border-border">
            <CardContent className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-1">Sign In</h2>
              <p className="text-muted-foreground text-sm mb-6">Enter your credentials to access the platform</p>

              {/* SSO Placeholder */}
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4 h-11 gap-2 border-border hover:bg-muted/50"
                onClick={() => toast.info('Organisation SSO login (Outlook) coming soon.')}
                data-testid="sso-login-btn"
              >
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm">Sign in with Organisation (SSO)</span>
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2.5 rounded-lg" data-testid="login-error">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      data-testid="login-email"
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="you@company.com" required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      data-testid="login-password"
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Enter your password" required
                    />
                  </div>
                </div>
                <Button data-testid="login-submit" type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                  {loading ? 'Signing in...' : <>Sign In <ChevronRight className="w-4 h-4 ml-1" /></>}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground mb-2">New to ELEVATE?</p>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm"
                  onClick={() => setShowRegistration(true)}
                  data-testid="register-btn"
                >
                  <UserPlus className="w-4 h-4" /> Register for the Platform
                </Button>
              </div>

              {/* Demo Quick Login */}
              <div className="mt-4 pt-4 border-t border-dashed border-border">
                <p className="text-xs text-muted-foreground text-center mb-3">Demo Access</p>

                {!demoPicker ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="ghost" size="sm"
                      className="h-9 text-xs font-medium gap-1.5 border border-border/50 hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => setDemoPicker('coach')}
                      data-testid="demo-login-coach"
                    >
                      <Award className="w-3 h-3" /> Coach
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-9 text-xs font-medium gap-1.5 border border-border/50 hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => setDemoPicker('coachee')}
                      data-testid="demo-login-coachee"
                    >
                      <Users className="w-3 h-3" /> Coachee
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-9 text-xs font-medium gap-1.5 border border-border/50 hover:border-primary/40 hover:bg-primary/5"
                      onClick={() => handleDemoLogin('Raeesa.Naim@in.gt.com')}
                      disabled={!!demoLoading}
                      data-testid="demo-login-admin"
                    >
                      {demoLoading === 'Raeesa.Naim@in.gt.com' ? <span className="animate-pulse">...</span> : <><Shield className="w-3 h-3" /> Admin</>}
                    </Button>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-foreground capitalize">Select {demoPicker}</p>
                      <button onClick={() => setDemoPicker(null)} className="text-xs text-muted-foreground hover:text-foreground">&larr; Back</button>
                    </div>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {(demoPicker === 'coach' ? demoCoaches : demoCoachees).map((person) => (
                        <button
                          key={person.email}
                          onClick={() => handleDemoLogin(person.email)}
                          disabled={!!demoLoading}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                          data-testid={`demo-pick-${person.email.split('@')[0]}`}
                        >
                          {demoLoading === person.email ? (
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{person.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{person.detail || person.location}</p>
                          </div>
                          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Grant Thornton Internal &middot; ELEVATE Coaching Platform
          </p>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && <RegistrationForm onClose={() => setShowRegistration(false)} />}
    </div>
  );
}
