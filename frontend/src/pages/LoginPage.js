import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useApp } from '../context/AppContext';
import { Shield, TrendingUp, Award, Users, ChevronRight, Lock, Mail, AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'coach') navigate('/coach-dashboard');
      else if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email) => {
    setEmail(email);
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      const user = await login(email, 'password123');
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'coach') navigate('/coach-dashboard');
      else if (user.role === 'admin') navigate('/admin-dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Sarah (Coachee)', email: 'sarah@elevate.com', role: 'Coachee', color: 'text-primary', bg: 'bg-primary-subtle' },
    { label: 'Alex (Coachee)', email: 'alex@elevate.com', role: 'Coachee', color: 'text-primary', bg: 'bg-primary-subtle' },
    { label: 'Fatema (Coach)', email: 'fatema@elevate.com', role: 'Coach', color: 'text-accent', bg: 'bg-accent-subtle' },
    { label: 'Vaishali (Coach)', email: 'vaishali@elevate.com', role: 'Coach', color: 'text-accent', bg: 'bg-accent-subtle' },
    { label: 'Admin', email: 'admin@elevate.com', role: 'Admin', color: 'text-warning', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-primary px-6 py-6">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">GT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/80 font-sans text-sm">Grant Thornton</span>
              <span className="text-white/40">|</span>
              <span className="text-white font-heading font-bold text-xl tracking-wide">Elevate</span>
            </div>
          </div>
          <div className="max-w-xl">
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Welcome to ELEVATE</h1>
            <p className="text-white/70 text-sm leading-relaxed">
              A structured coaching platform connecting employees with certified coaches for goal-oriented professional development.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { icon: Users, label: '50+ Active Coaches' },
              { icon: TrendingUp, label: '248 Sessions Completed' },
              { icon: Award, label: 'ICF Certified' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-white/80">
                <item.icon className="w-4 h-4 text-accent" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 max-w-screen-lg mx-auto px-4 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Login Card */}
          <Card className="shadow-card">
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
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@elevate.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="login-email-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="login-password-input"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3 border border-red-200" data-testid="login-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  disabled={loading}
                  data-testid="login-submit-btn"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Access */}
          <div>
            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Quick Demo Access</h3>
            <p className="text-xs text-muted-foreground mb-4">Click any account below to sign in instantly. Password: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">password123</code></p>
            <div className="space-y-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => quickLogin(acc.email)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-fast text-left"
                  data-testid={`quick-login-${acc.email.split('@')[0]}`}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{acc.label}</p>
                    <p className="text-xs text-muted-foreground">{acc.email}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${acc.bg} ${acc.color}`}>{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          This is a demo platform with pre-populated test accounts.
        </p>
      </div>
    </div>
  );
}
