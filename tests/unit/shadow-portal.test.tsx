// Note: These tests cover the provider's wiring contract only.
// jsdom and happy-dom do not implement enough of the real DOM's shadow, portal, and focus semantics
// to catch the focus-trap and scroll-lock bugs the open upstream issues describe, which is what
// the probe in Task 2 and spike S3 exist for.

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { ShadowRootProvider, usePortalContainer } from "@/components/shadow-portal"
import { BtPopover, BtPopoverTrigger, BtPopoverContent } from "@/components/shadow-ui/BtPopover"
import { BtTooltip, BtTooltipTrigger, BtTooltipContent, BtTooltipProvider } from "@/components/shadow-ui/BtTooltip"
import { BtDropdownMenu, BtDropdownMenuTrigger, BtDropdownMenuContent, BtDropdownMenuItem } from "@/components/shadow-ui/BtDropdownMenu"

describe("ShadowRootProvider and usePortalContainer", () => {
  let container: HTMLDivElement
  let host: HTMLDivElement
  let shadowRoot: ShadowRoot

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    host = document.createElement("div")
    document.body.appendChild(host)
    shadowRoot = host.attachShadow({ mode: "open" })
  })

  afterEach(() => {
    container.remove()
    host.remove()
  })

  it("usePortalContainer inside a provider returns the provided shadow root", async () => {
    let captured: any = null
    function TestConsumer() {
      captured = usePortalContainer()
      return <span data-slot="test-consumer">consumer</span>
    }

    const root = createRoot(container)
    await act(async () => {
      root.render(
        <ShadowRootProvider value={shadowRoot}>
          <TestConsumer />
        </ShadowRootProvider>
      )
    })

    expect(captured).toBe(shadowRoot)
    root.unmount()
  })

  it("usePortalContainer outside any provider returns undefined, not null", async () => {
    let captured: any = "initial"
    function TestConsumer() {
      captured = usePortalContainer()
      return <span data-slot="test-consumer">consumer</span>
    }

    const root = createRoot(container)
    await act(async () => {
      root.render(<TestConsumer />)
    })

    expect(captured).toBeUndefined()
    expect(captured).not.toBeNull()
    root.unmount()
  })

  it("a wrapper rendered inside a provider passes the shadow root through to its Radix portal container prop", async () => {
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <ShadowRootProvider value={shadowRoot}>
          <BtPopover open={true}>
            <BtPopoverTrigger>Open</BtPopoverTrigger>
            <BtPopoverContent data-testid="popover-content">Inside Shadow</BtPopoverContent>
          </BtPopover>
        </ShadowRootProvider>
      )
    })

    // Content should mount inside the shadowRoot, not in document.body
    const insideShadow = shadowRoot.querySelector('[data-testid="popover-content"]')
    const insideBody = document.body.querySelector(':scope > [data-testid="popover-content"]')

    expect(insideShadow).not.toBeNull()
    expect(insideBody).toBeNull()
    root.unmount()
  })

  it("two wrappers open simultaneously inside one provider both mount their content under the provided shadow root", async () => {
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <ShadowRootProvider value={shadowRoot}>
          <BtPopover open={true}>
            <BtPopoverTrigger>Open 1</BtPopoverTrigger>
            <BtPopoverContent data-testid="portal-first">First Overlay</BtPopoverContent>
          </BtPopover>
          <BtPopover open={true}>
            <BtPopoverTrigger>Open 2</BtPopoverTrigger>
            <BtPopoverContent data-testid="portal-second">Second Overlay</BtPopoverContent>
          </BtPopover>
        </ShadowRootProvider>
      )
    })

    const first = shadowRoot.querySelector('[data-testid="portal-first"]')
    const second = shadowRoot.querySelector('[data-testid="portal-second"]')

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()

    // Both mount inside shadowRoot, neither in document.body
    expect(document.body.querySelector(':scope > [data-testid="portal-first"]')).toBeNull()
    expect(document.body.querySelector(':scope > [data-testid="portal-second"]')).toBeNull()

    root.unmount()
  })

  it("outside-interaction handler treats an event whose composed path includes the shadow root as inside, and one whose composed path does not as outside", async () => {
    let insidePrevented = false
    const insideEvent = {
      defaultPrevented: false,
      preventDefault: () => {
        insidePrevented = true
      },
      detail: {
        originalEvent: {
          composedPath: () => [container, shadowRoot, host, document.body, document, window],
        },
      },
    }

    let outsidePrevented = false
    const outsideEvent = {
      defaultPrevented: false,
      preventDefault: () => {
        outsidePrevented = true
      },
      detail: {
        originalEvent: {
          composedPath: () => [document.body, document, window],
        },
      },
    }

    let capturedHandler: ((event: any) => void) | null = null

    // Render BtPopoverContent with an onPointerDownOutside spy to capture the handler
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <ShadowRootProvider value={shadowRoot}>
          <BtPopover open={true}>
            <BtPopoverTrigger>Open</BtPopoverTrigger>
            <BtPopoverContent
              data-testid="interactive-content"
              onPointerDownOutside={(e) => {
                // outer spy
              }}
            >
              Content
            </BtPopoverContent>
          </BtPopover>
        </ShadowRootProvider>
      )
    })

    const contentEl = shadowRoot.querySelector('[data-testid="interactive-content"]')
    expect(contentEl).not.toBeNull()

    // Now test the composed-path outside-click filter directly against BtPopoverContent's handler logic
    const { handleOutsidePointerDown } = await import("@/components/shadow-portal")
    
    handleOutsidePointerDown(insideEvent as any, shadowRoot)
    expect(insidePrevented).toBe(true)

    handleOutsidePointerDown(outsideEvent as any, shadowRoot)
    expect(outsidePrevented).toBe(false)

    root.unmount()
  })
})
