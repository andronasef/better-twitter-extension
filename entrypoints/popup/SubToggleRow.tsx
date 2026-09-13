import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import type { FeatureEntry } from '@/lib/registry';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SubToggleRowProps {
  feature: FeatureEntry;
  parentFeature?: FeatureEntry;
  parentEnabled: boolean;
  checked: boolean;
  disabled: boolean;
  hasDiagnosticMiss: boolean;
  onToggle: (checked: boolean) => void;
}

export function SubToggleRow({
  feature,
  parentFeature,
  parentEnabled,
  checked,
  disabled,
  hasDiagnosticMiss,
  onToggle,
}: SubToggleRowProps) {
  const isRowDimmed = !parentEnabled;
  const effectiveDisabled = disabled || !parentEnabled;
  const tooltipText = !parentEnabled
    ? `Enable ${parentFeature?.title || 'parent setting'} to activate this setting.`
    : feature.tooltip;

  return (
    <div
      className={`relative min-h-[40px] py-2 pl-7 pr-4 flex flex-col justify-center transition-opacity duration-150 ${
        isRowDimmed ? 'opacity-50' : ''
      }`}
    >
      {/* Visual connector line indicating sub-toggle hierarchy */}
      <div
        aria-hidden="true"
        className="absolute left-[14px] top-0 bottom-1/2 w-[10px] border-b border-l border-[var(--bt-border)] rounded-bl-[4px] pointer-events-none"
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center flex-1 min-w-0 pr-2">
          <span className="text-[13px] font-normal leading-[18.2px] text-[var(--bt-fg)] break-words">
            {feature.title}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`What does ${feature.title} do?`}
                className="ml-2 inline-flex items-center justify-center text-[var(--bt-fg-muted)] hover:text-[var(--bt-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bt-accent)] focus-visible:ring-offset-2 rounded-full cursor-pointer shrink-0"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="max-w-[260px] bg-[var(--bt-surface)] text-[var(--bt-fg)] border border-[var(--bt-border)] rounded-[8px] p-2 text-[13px] font-normal leading-[18.2px] shadow-sm z-50"
            >
              <p className="break-words">{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Switch
          id={feature.id}
          checked={checked}
          disabled={effectiveDisabled}
          onCheckedChange={onToggle}
          aria-label={feature.title}
        />
      </div>

      {hasDiagnosticMiss && (
        <div className="mt-2 p-2 rounded-[8px] bg-[var(--bt-warn)]/10 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[var(--bt-warn)] shrink-0 mt-0.5" />
          <div className="text-[12px] font-normal leading-[16.8px] text-[var(--bt-fg)]">
            <div className="font-normal text-[var(--bt-fg)]">Not matching X&apos;s current layout</div>
            <div className="text-[var(--bt-fg)] mt-0.5">
              X changed its markup, so this toggle isn&apos;t finding anything right now. Everything else still works.
            </div>
            <a
              href="https://github.com/thewh1teagle/better-twitter/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--bt-accent)] hover:underline inline-block mt-1"
            >
              Report an issue
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
