// This is the one place the project's "one content script for the whole extension" rule
// is deliberately broken, and it is safe only because this second script exists exclusively
// in development to measure Radix UI primitives inside a ShadowRoot (Spike S3) against live X overlay states.
// It is excluded from production builds so that the shipped extension contains exactly one content script.

import ReactDOM from "react-dom/client"
import { ShadowRootProvider } from "@/components/shadow-portal"
import { ProbePanel } from "./ProbePanel"
import "./probe.css"

export default defineContentScript({
  matches: ["*://x.com/*", "*://twitter.com/*"],
  cssInjectionMode: "ui",
  // Entrypoint-level exclusion: dev-only probe, excluded from production builds
  exclude: import.meta.env.PROD ? ["chrome", "firefox", "safari", "edge"] : undefined,

  async main(ctx) {
    if (import.meta.env.PROD) {
      return
    }

    const ui = await createShadowRootUi(ctx, {
      name: "bt-probe",
      position: "inline",
      anchor: "body",
      append: "last",
      isolateEvents: ["keydown", "pointerdown"],
      onMount: (container) => {
        const root = ReactDOM.createRoot(container)
        root.render(
          <ShadowRootProvider value={ui.shadow}>
            <ProbePanel />
          </ShadowRootProvider>
        )
        return root
      },
      onRemove: (root) => {
        root?.unmount()
      },
    })

    ui.mount()
  },
})
