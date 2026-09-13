import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "cn"
import { usePortalContainer } from "@/components/shadow-portal"

function BtPopover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="bt-popover" {...props} />
}

function BtPopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="bt-popover-trigger" {...props} />
}

function BtPopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="bt-popover-anchor" {...props} />
}

function BtPopoverClose({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="bt-popover-close" {...props} />
}

function BtPopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  onPointerDownOutside,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const container = usePortalContainer()

  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-slot="bt-popover-content"
        align={align}
        sideOffset={sideOffset}
        onPointerDownOutside={(event) => {
          if (container) {
            const originalEvent = (event as any).detail?.originalEvent ?? event
            const path =
              typeof originalEvent?.composedPath === "function"
                ? originalEvent.composedPath()
                : typeof (event as any).composedPath === "function"
                  ? (event as any).composedPath()
                  : []
            if (path.includes(container)) {
              event.preventDefault()
              return
            }
          }
          onPointerDownOutside?.(event)
        }}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

BtPopover.Trigger = BtPopoverTrigger
BtPopover.Content = BtPopoverContent
BtPopover.Anchor = BtPopoverAnchor
BtPopover.Close = BtPopoverClose

export {
  BtPopover,
  BtPopoverTrigger,
  BtPopoverContent,
  BtPopoverAnchor,
  BtPopoverClose,
}
