import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { Target, Users, BarChart2, ChevronRight, Shield, TrendingUp, Award, Clock, Star } from 'lucide-react';

export default function LoginPage() {
  const { setCurrentRole } = useApp();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [hoveredRole, setHoveredRole] = useState(null);

  const roles = [
    {
      id: 'coachee',
      label: 'Coachee',
      description: 'Browse coaches, request coaching, manage sessions and track your development journey.',
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary-subtle',
      badge: 'Employee',
      features: ['Find & request coaches', 'Schedule sessions', 'Track progress', 'Submit feedback'],
      defaultPath: '/'
    },
    {
      id: 'coach',
      label: 'Coach',
      description: 'Manage coaching requests, conduct sessions, and support your coachees\'s growth.',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent-subtle',
      badge: 'Certified Coach',
      features: ['View & accept requests', 'Manage sessions', 'Track coachees', 'View ratings'],
      defaultPath: '/coach-dashboard'
    },
    {
      id: 'admin',
      label: 'Admin',
      description: 'Oversee the entire coaching program, manage coaches, and access analytics.',
      icon: BarChart2,
      color: 'text-warning',
      bgColor: 'bg-yellow-50',
      badge: 'Platform Admin',
      features: ['Approve coaches', 'Monitor sessions', 'View analytics', 'Generate reports'],
      defaultPath: '/admin-dashboard'
    },
  ];

  const handleEnter = (role) => {
    setCurrentRole(role.id);
    navigate(role.defaultPath);
  };

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
              { icon: Star, label: '4.8 Avg Rating' },
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

      {/* Role Selection */}
      <div className="flex-1 max-w-screen-lg mx-auto px-4 py-10 w-full">
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-xl text-foreground">Choose your role to continue</h2>
          <p className="text-muted-foreground text-sm mt-1">This is a demo — select any role to explore the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(role => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            const isHovered = hoveredRole === role.id;
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-smooth overflow-hidden ${
                  isSelected ? 'ring-2 ring-primary shadow-primary' : 'hover:shadow-md hover:ring-1 hover:ring-primary/30'
                }`}
                onClick={() => setSelectedRole(role.id)}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
              >
                <div className="coach-banner opacity-90 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-white/80" />
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-bold text-lg text-foreground">{role.label}</h3>
                    <Badge variant="outline" className="text-xs border-border">{role.badge}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{role.description}</p>
                  <ul className="space-y-1.5 mb-5">
                    {role.features.map(feat => (
                      <li key={feat} className="flex items-center gap-2 text-sm text-foreground/80">
                        <div className={`w-1.5 h-1.5 rounded-full ${role.bgColor} flex-shrink-0`} style={{ background: 'hsl(var(--primary))' }} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Button
                      className={`w-full ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-primary'
                          : 'bg-primary/90 text-primary-foreground hover:bg-primary'
                      }`}
                      onClick={(e) => { e.stopPropagation(); handleEnter(role); }}
                    >
                      Enter as {role.label} <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          <Shield className="w-3.5 h-3.5 inline mr-1" />
          This is a prototype demo. Role-based access control would be enforced in production.
        </p>
      </div>
    </div>
  );
}
