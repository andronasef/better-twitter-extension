import React, { useState } from "react"
import {
  BtPopover,
  BtPopoverTrigger,
  BtPopoverContent,
} from "@/components/shadow-ui/BtPopover"
import {
  BtDropdownMenu,
  BtDropdownMenuTrigger,
  BtDropdownMenuContent,
  BtDropdownMenuItem,
  BtDropdownMenuSeparator,
} from "@/components/shadow-ui/BtDropdownMenu"
import {
  BtTooltip,
  BtTooltipTrigger,
  BtTooltipContent,
  BtTooltipProvider,
} from "@/components/shadow-ui/BtTooltip"

export function ProbePanel() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <BtTooltipProvider>
      <div
        data-testid="probe-panel"
        className="fixed bottom-4 right-4 z-[999999] rounded-lg border border-border bg-background p-4 shadow-xl text-foreground font-sans w-80"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
          <div className="font-semibold text-sm">BT Shadow Probe (Dev Only)</div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>

        {!collapsed && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">
              Testing Radix primitives in ShadowRoot against live X overlay states.
            </div>

            {/* 1. BtPopover with text input, multiple focusable items, long scroll body */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Popover:</span>
              <BtPopover>
                <BtPopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="probe-popover-trigger"
                    className="px-2.5 py-1 text-xs rounded bg-primary text-primary-foreground font-medium cursor-pointer"
                  >
                    Open Popover
                  </button>
                </BtPopoverTrigger>
                <BtPopoverContent
                  data-testid="probe-popover-content"
                  className="w-72 max-h-60 overflow-y-auto flex flex-col gap-2 p-3"
                >
                  <div className="font-semibold text-sm">Popover Probe</div>
                  <input
                    type="text"
                    placeholder="Focusable text input..."
                    data-testid="probe-popover-input"
                    className="border border-border rounded px-2 py-1 text-xs bg-background text-foreground"
                  />
                  <div className="flex flex-col gap-1 text-xs">
                    <button
                      type="button"
                      className="px-2 py-1 bg-muted rounded text-left cursor-pointer"
                    >
                      Action Item 1
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 bg-muted rounded text-left cursor-pointer"
                    >
                      Action Item 2
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 bg-muted rounded text-left cursor-pointer"
                    >
                      Action Item 3
                    </button>
                    <p className="text-muted-foreground">
                      Scrollable overflow content to verify timeline does not scroll behind overlay when interacting.
                      Additional line 1.
                      Additional line 2.
                      Additional line 3.
                      Additional line 4.
                    </p>
                  </div>
                </BtPopoverContent>
              </BtPopover>
            </div>

            {/* 2. BtDropdownMenu with multiple items and separator */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Dropdown:</span>
              <BtDropdownMenu>
                <BtDropdownMenuTrigger asChild>
                  <button
                    type="button"
                    data-testid="probe-dropdown-trigger"
                    className="px-2.5 py-1 text-xs rounded bg-muted text-foreground font-medium cursor-pointer border border-border"
                  >
                    Open Menu
                  </button>
                </BtDropdownMenuTrigger>
                <BtDropdownMenuContent
                  data-testid="probe-dropdown-content"
                  className="w-48"
                >
                  <BtDropdownMenuItem data-testid="probe-dropdown-item-1">
                    Menu Option Alpha
                  </BtDropdownMenuItem>
                  <BtDropdownMenuItem data-testid="probe-dropdown-item-2">
                    Menu Option Beta
                  </BtDropdownMenuItem>
                  <BtDropdownMenuSeparator />
                  <BtDropdownMenuItem data-testid="probe-dropdown-item-3">
                    Menu Option Gamma
                  </BtDropdownMenuItem>
                  <BtDropdownMenuItem variant="destructive">
                    Destructive Action
                  </BtDropdownMenuItem>
                </BtDropdownMenuContent>
              </BtDropdownMenu>
            </div>

            {/* 3. BtTooltip */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Tooltip:</span>
              <BtTooltip>
                <BtTooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid="probe-tooltip-trigger"
                    className="px-2.5 py-1 text-xs rounded bg-muted text-foreground cursor-pointer border border-border"
                  >
                    Hover Tooltip
                  </button>
                </BtTooltipTrigger>
                <BtTooltipContent data-testid="probe-tooltip-content">
                  Tooltip inside ShadowRoot
                </BtTooltipContent>
              </BtTooltip>
            </div>
          </div>
        )}
      </div>
    </BtTooltipProvider>
  )
}
