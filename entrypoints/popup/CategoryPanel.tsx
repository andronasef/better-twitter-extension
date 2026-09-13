import React from 'react';
import type { FeatureEntry, CategoryEntry } from '@/lib/registry';
import type { Settings, Diagnostics } from '@/lib/storage';
import { ToggleRow } from './ToggleRow';

interface CategoryPanelProps {
  category: CategoryEntry;
  features: FeatureEntry[];
  settings: Settings | null;
  diagnostics: Diagnostics;
  onToggle: (featureId: string, checked: boolean) => void;
}

export function CategoryPanel({
  features,
  settings,
  diagnostics,
  onToggle,
}: CategoryPanelProps) {
  return (
    <div className="view-enter-panel flex flex-col divide-y divide-[var(--bt-border)]">
      {features.map((feature) => {
        const isChecked = settings ? !!settings.features[feature.id] : feature.defaultEnabled;
        const isDisabled = settings === null;
        const hasDiagnosticMiss = !!diagnostics[feature.id];

        return (
          <ToggleRow
            key={feature.id}
            feature={feature}
            checked={isChecked}
            disabled={isDisabled}
            hasDiagnosticMiss={hasDiagnosticMiss}
            onToggle={(checked) => onToggle(feature.id, checked)}
          />
        );
      })}
    </div>
  );
}
