import React from 'react';
import type { FeatureEntry, CategoryEntry } from '@/lib/registry';
import type { Settings, Diagnostics } from '@/lib/storage';
import { ToggleRow } from './ToggleRow';
import { SubToggleRow } from './SubToggleRow';

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
  const topLevelFeatures = features.filter((f) => !f.parentId);

  return (
    <div className="view-enter-panel flex flex-col divide-y divide-[var(--bt-border)]">
      {topLevelFeatures.map((feature) => {
        const isChecked = settings ? !!settings.features[feature.id] : feature.defaultEnabled;
        const isDisabled = settings === null;
        const hasDiagnosticMiss = !!diagnostics[feature.id];
        const childFeatures = features.filter((f) => f.parentId === feature.id);

        return (
          <div key={feature.id} className="flex flex-col">
            <ToggleRow
              feature={feature}
              checked={isChecked}
              disabled={isDisabled}
              hasDiagnosticMiss={hasDiagnosticMiss}
              onToggle={(checked) => onToggle(feature.id, checked)}
            />

            {childFeatures.map((child) => {
              const isChildChecked = settings ? !!settings.features[child.id] : child.defaultEnabled;
              const hasChildMiss = !!diagnostics[child.id];

              return (
                <SubToggleRow
                  key={child.id}
                  feature={child}
                  parentFeature={feature}
                  parentEnabled={isChecked}
                  checked={isChildChecked}
                  disabled={isDisabled}
                  hasDiagnosticMiss={hasChildMiss}
                  onToggle={(checked) => onToggle(child.id, checked)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
