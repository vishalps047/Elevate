import { useState } from 'react';
import { Star, MapPin, Award, Users, ChevronRight, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';

export function StarRating({ rating, size = 'sm' }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <Star
          key={s}
          className={`${
            size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
          } ${
            s <= Math.floor(rating) ? 'fill-warning text-warning' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );
}

export function CoachCard({ coach, onSelectCoach, isSelected = false, mode = 'select' }) {
  const slotsColor = coach.slots.available === 0
    ? 'bg-destructive/10 text-destructive border-destructive/30'
    : coach.slots.available === coach.slots.total
    ? 'bg-success/10 text-success border-success/30'
    : 'bg-accent-subtle text-accent border-accent/30';

  return (
    <Card className={`overflow-hidden shadow-card hover:shadow-md transition-smooth group cursor-pointer ${
      isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-primary/30'
    }`}>
      {/* Banner */}
      <div className="coach-banner relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        {/* Slots badge */}
        <div className={`absolute top-3 right-3 border rounded-lg px-2.5 py-2 text-center ${slotsColor}`}>
          <div className="text-lg font-heading font-bold leading-none">{coach.slots.available}/{coach.slots.total}</div>
          <div className="text-xs mt-0.5 leading-none">Slots</div>
          <div className="text-xs leading-none">Available</div>
        </div>
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        {/* Avatar */}
        <div className="absolute -bottom-6 left-4">
          <Avatar className="w-14 h-14 border-3 border-white shadow-md" style={{ border: '3px solid white' }}>
            <AvatarImage src={coach.avatar} />
            <AvatarFallback className="bg-primary text-white font-semibold">
              {coach.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <CardContent className="pt-9 pb-4 px-4 flex flex-col h-full">
        {/* Name & Title */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h3 className="font-heading font-semibold text-foreground">{coach.name}</h3>
          <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary-subtle">
            <Award className="w-3 h-3 mr-1" />{coach.title}
          </Badge>
        </div>

        {/* Rating & Location */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <StarRating rating={coach.rating} />
            <span className="text-sm font-semibold text-warning">{coach.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="text-xs">{coach.location}</span>
          </div>
        </div>

        {/* About */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">About</p>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{coach.about}</p>
        </div>

        {/* Expertise */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Area of Expertise</p>
          <div className="flex flex-wrap gap-1.5">
            {coach.expertise.slice(0, 4).map((exp) => (
              <span key={exp} className="expertise-tag">{exp}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto">
          {coach.slots.available === 0 ? (
            <Button
              disabled
              className="w-full text-sm"
              variant="outline"
            >
              No Slots Available
            </Button>
          ) : mode === 'select' ? (
            <Button
              className="w-full text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary"
              onClick={() => onSelectCoach && onSelectCoach(coach)}
            >
              <Users className="w-4 h-4 mr-2" />
              {isSelected ? 'Selected' : 'Send Request →'}
            </Button>
          ) : (
            <Button
              className="w-full text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => onSelectCoach && onSelectCoach(coach)}
            >
              View Profile →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
