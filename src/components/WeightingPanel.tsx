'use client';

import { ChartWeights } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Sliders } from '@phosphor-icons/react';
import { calculateTotalWeight } from '@/lib/math/normalization';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeightingPanelProps {
  weights: ChartWeights;
  onChange: (weights: ChartWeights) => void;
}

export function WeightingPanel({ weights, onChange }: WeightingPanelProps) {
  const { t } = useLanguage();
  const handleFanChange = (value: number[]) => {
    onChange({ ...weights, fan: value[0], streaming: 0 });
  };

  const handleExpertChange = (value: number[]) => {
    onChange({ ...weights, expert: value[0], streaming: 0 });
  };

  const total = calculateTotalWeight(weights);

  return (
    <Card className="bg-card border border-border p-5 sticky top-24">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-accent">
        <Sliders weight="bold" className="w-6 h-6 text-accent" />
        <h3 className="font-ui text-lg font-bold uppercase tracking-[0.1em] text-foreground">
            {t('custom.chartWeights')}
        </h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-card-foreground">
              {t('pillar.fan')}
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums px-2 py-0.5 bg-background border border-accent">
              {weights.fan}%
            </span>
          </div>
          <Slider value={[weights.fan]} onValueChange={handleFanChange} max={100} step={1} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-ui text-[10px] font-bold uppercase tracking-[0.15em] text-card-foreground">
              {t('pillar.club')}
            </label>
            <span className="data-font text-lg font-bold text-accent tabular-nums px-2 py-0.5 bg-background border border-accent">
              {weights.expert}%
            </span>
          </div>
          <Slider value={[weights.expert]} onValueChange={handleExpertChange} max={100} step={1} />
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-card-foreground">
              {t('custom.total')}
            </span>
            <span
              className={`data-font text-xl font-bold tabular-nums px-2 py-1 border ${total !== 100 ? 'text-primary border-primary' : 'text-accent border-accent'}`}
            >
              {total}%
            </span>
          </div>
          {total !== 100 && (
            <p className="text-[10px] text-muted-foreground mt-2 font-ui uppercase tracking-[0.15em] text-center">
              {t('custom.renormalize')}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}