import { useState, useMemo } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';

export default function CoachFilters({ expertiseOptions, selectedExpertise, onExpertiseChange }) {
  const allSelected = useMemo(
    () => expertiseOptions.length > 0 && selectedExpertise.length === expertiseOptions.length,
    [expertiseOptions, selectedExpertise]
  );

  const toggleAll = () => {
    onExpertiseChange(allSelected ? [] : [...expertiseOptions]);
  };

  const toggleExpertise = (exp) => {
    if (selectedExpertise.includes(exp)) {
      onExpertiseChange(selectedExpertise.filter(e => e !== exp));
    } else {
      onExpertiseChange([...selectedExpertise, exp]);
    }
  };

  const resetFilters = () => {
    onExpertiseChange([...expertiseOptions]);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-card sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <span className="font-heading font-semibold text-foreground">Filters</span>
        <button onClick={resetFilters} className="w-7 h-7 rounded-md bg-primary-subtle flex items-center justify-center hover:bg-primary/20 transition-fast">
          <Filter className="w-3.5 h-3.5 text-primary" />
        </button>
      </div>

      <Separator className="mb-4" />

      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Area of Expertise</p>

        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <Checkbox
            id="select-all"
            checked={allSelected}
            onCheckedChange={toggleAll}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All ({expertiseOptions.length})
          </Label>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
          {expertiseOptions.map((exp) => (
            <div key={exp} className="flex items-center gap-2">
              <Checkbox
                id={`exp-${exp}`}
                checked={selectedExpertise.includes(exp)}
                onCheckedChange={() => toggleExpertise(exp)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor={`exp-${exp}`} className="text-sm text-foreground/80 cursor-pointer leading-tight">
                {exp}
              </Label>
            </div>
          ))}
          {expertiseOptions.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No expertise areas found</p>
          )}
        </div>
      </div>

      {!allSelected && selectedExpertise.length < expertiseOptions.length && (
        <Button variant="ghost" size="sm" className="w-full mt-4 text-xs text-primary h-8" onClick={resetFilters}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset Filters
        </Button>
      )}
    </div>
  );
}
