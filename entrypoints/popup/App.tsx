import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function App() {
  return (
    <TooltipProvider>
      <div className="w-[360px] h-[480px] p-4 bg-background text-foreground">
        <h1 className="text-lg font-bold">Better Twitter!</h1>
        <div className="flex items-center space-x-2 mt-4">
          <Switch id="promo-toggle" />
          <Tooltip>
            <TooltipTrigger asChild>
              <label htmlFor="promo-toggle" className="text-sm font-medium">Hide promoted tweets</label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hides promoted tweets from feed</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}