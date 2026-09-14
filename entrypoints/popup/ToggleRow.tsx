import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import type { FeatureEntry } from '@/lib/registry';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ToggleRowProps {
  feature: FeatureEntry;
  checked: boolean;
  disabled: boolean;
  hasDiagnosticMiss: boolean;
  onToggle: (checked: boolean) => void;
}

export function ToggleRow({
  feature,
  checked,
  disabled,
  hasDiagnosticMiss,
  onToggle,
}: ToggleRowProps) {
  return (
    <div className="min-h-[48px] py-3 px-4 flex flex-col justify-center">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center flex-1 min-w-0 pr-2">
          <span className="text-[15px] font-normal leading-[22.5px] text-[var(--bt-fg)] break-words">
            {feature.title}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`What does ${feature.title} do?`}
                className="ml-2 inline-flex items-center justify-center text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 rounded-full cursor-pointer shrink-0"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="max-w-[260px] bg-[var(--bt-surface)] text-[var(--bt-fg)] border border-[var(--bt-border)] rounded-[8px] p-2 text-[13px] font-normal leading-[18.2px] shadow-sm"
            >
              <p className="break-words">{feature.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Switch
          id={feature.id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onToggle}
          aria-label={feature.title}
        />
      </div>

      {hasDiagnosticMiss && (
        <div className="mt-2 p-2 rounded-[8px] bg-[var(--bt-warn)]/10 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--bt-warn)] shrink-0 mt-0.5" />
          <div className="text-[13px] font-normal leading-[18.2px] text-[var(--bt-fg)]">
            <div className="font-normal text-[var(--bt-fg)]">Not matching X&apos;s current layout</div>
            <div className="text-[var(--bt-fg)] mt-0.5">
              X changed its markup, so this toggle isn&apos;t finding anything right now. Everything else still works.
            </div>
            <a
              href="https://bettertwitter.featurebase.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[var(--bt-accent)] hover:underline inline-block mt-1"
            >
              Report an issue
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
