import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MapPin, Award, BookOpen, Users, Check, Plus } from 'lucide-react';
import { Button } from './ui/button';

export function StarRating({ rating, size = 'sm' }) {
  const stars = Math.round(rating * 2) / 2;
  const dim = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`${dim} ${i <= Math.floor(stars) ? 'fill-warning text-warning' : i - 0.5 === stars ? 'fill-warning/50 text-warning' : 'fill-muted text-muted-foreground'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function CoachCard({ coach, onSelectCoach, isSelected, preferenceNumber, mode = 'view' }) {
  return (
    <Card className={`shadow-card hover:shadow-md transition-smooth overflow-hidden h-full flex flex-col ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`} data-testid={`coach-card-${coach.id}`}>
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="coach-banner relative flex-shrink-0">
          <div className="absolute inset-0 opacity-10 bg-white" />
          {isSelected && (
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md">
              #{preferenceNumber}
            </div>
          )}
        </div>
        <div className="p-4 -mt-5 flex flex-col flex-1">
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12 flex-shrink-0" style={{ border: '3px solid white' }}>
              <AvatarImage src={coach.avatar} />
              <AvatarFallback className="bg-primary-light text-white">{coach.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-sm text-foreground truncate" data-testid={`coach-name-${coach.id}`}>{coach.name}</h3>
              <p className="text-xs text-muted-foreground">{coach.title}</p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 mb-2 mt-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{coach.location}</span>
            </div>
          </div>

          {/* Certifications */}
          <div className="flex flex-wrap gap-1 mb-2">
            {(coach.certifications || []).slice(0, 2).map(cert => (
              <Badge key={cert} variant="outline" className="text-xs px-2 py-0.5 gap-1 bg-primary-subtle border-primary/20 text-primary font-normal">
                <Award className="w-3 h-3" />{cert}
              </Badge>
            ))}
          </div>

          {/* Expertise */}
          <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
            {(coach.expertise || []).slice(0, 3).map(exp => (
              <span key={exp} className="text-xs bg-accent-subtle text-accent px-2 py-0.5 rounded-full">{exp}</span>
            ))}
          </div>

          {/* About */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{coach.about}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {coach.experience}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {coach.slots?.available || 0} slots</span>
            </div>
            {mode === 'select' && (
              <Button
                size="sm"
                className={`text-xs h-7 px-3 ${
                  isSelected
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : coach.slots?.available === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-accent hover:bg-accent/90 text-white'
                }`}
                onClick={() => onSelectCoach(coach)}
                disabled={coach.slots?.available === 0 && !isSelected}
                data-testid={`select-coach-${coach.id}`}
              >
                {isSelected ? <><Check className="w-3 h-3 mr-1" /> Selected</> : <><Plus className="w-3 h-3 mr-1" /> Select</>}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
