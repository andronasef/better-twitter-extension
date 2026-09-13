import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { categories, features } from '@/lib/registry';
import { settingsItem, type Settings } from '@/lib/storage';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function App() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    // Read settings immediately on mount
    settingsItem.getValue().then((val) => {
      setSettings(val);
    });

    // Listen for live updates (e.g. storage changes)
    const unwatch = settingsItem.watch((newVal) => {
      setSettings(newVal);
    });

    return () => {
      unwatch();
    };
  }, []);

  const handleToggle = async (featureId: string, enabled: boolean) => {
    const prev = settings || (await settingsItem.getValue());
    const next: Settings = {
      ...prev,
      features: {
        ...prev.features,
        [featureId]: enabled,
      },
    };
    setSettings(next);
    await settingsItem.setValue(next);
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const activeFeatures = activeCategory
    ? features.filter((f) => f.categoryId === activeCategory.id)
    : [];

  return (
    <TooltipProvider delayDuration={400}>
      <div className="w-[360px] h-[480px] bg-background text-foreground flex flex-col select-none overflow-hidden font-sans">
        {/* Header - 48px fixed */}
        <header className="h-[48px] min-h-[48px] px-4 flex items-center border-b border-border">
          {activeCategory ? (
            <div className="flex items-center space-x-2 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-1 text-foreground hover:bg-muted"
                onClick={() => setActiveCategoryId(null)}
                aria-label="Back to categories"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-base font-bold leading-none">{activeCategory.caption}</h1>
            </div>
          ) : (
            <h1 className="text-base font-bold tracking-tight">Better Twitter!</h1>
          )}
        </header>

        {/* Content Viewport - 392px fixed */}
        <main className="h-[392px] max-h-[392px] overflow-y-auto p-4">
          {!activeCategory ? (
            /* 3-column tile grid, 8px gap, tiles 104x104, real button */
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategoryId(cat.id)}
                    className="w-[104px] h-[104px] rounded-lg border border-border bg-card p-3 flex flex-col items-center justify-center gap-2 hover:bg-muted transition-colors cursor-pointer text-card-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <IconComponent className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium leading-tight text-center truncate w-full">
                      {cat.caption}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Category Feature List */
            <div className="flex flex-col divide-y divide-border">
              {activeFeatures.map((feat) => {
                const isChecked = settings ? !!settings.features[feat.id] : feat.defaultEnabled;
                const isDisabled = settings === null;

                return (
                  <div
                    key={feat.id}
                    className="min-h-[48px] py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 pr-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-medium leading-tight cursor-default">
                            {feat.title}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-[260px]">
                          <p>{feat.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      id={feat.id}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={(checked) => handleToggle(feat.id, checked)}
                      aria-label={feat.title}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Footer - 40px fixed */}
        <footer className="h-[40px] min-h-[40px] px-4 flex items-center justify-between border-t border-border text-xs text-muted-foreground">
          <span>v0.1.0</span>
          <span>Clean &amp; respectful</span>
        </footer>
      </div>
    </TooltipProvider>
  );
}