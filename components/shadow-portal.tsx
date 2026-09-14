import * as React from "react";
import tailwindStyles from "@/assets/tailwind.css?inline";

const ShadowRootContext = React.createContext<ShadowRoot | null>(null);

export interface ShadowRootProviderProps {
  value: ShadowRoot | null | undefined;
  children: React.ReactNode;
}

/**
 * Injects Better Twitter styles and theme CSS variables into the given ShadowRoot.
 */
export function injectShadowStyles(shadowRoot: ShadowRoot): void {
  if (!shadowRoot || typeof shadowRoot.querySelector !== "function") return;
  if (shadowRoot.querySelector("style[data-bt-styles]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-bt-styles", "true");
  style.textContent = tailwindStyles || "";
  shadowRoot.prepend(style);
}

/**
 * Provides a ShadowRoot to descendant components so Radix floating primitives
 * can attach their portals inside the shadow root rather than escaping to document.body.
 */
export function ShadowRootProvider({
  value,
  children,
}: ShadowRootProviderProps) {
  if (value) {
    injectShadowStyles(value);
  }

  return (
    <ShadowRootContext.Provider value={value ?? null}>
      {children}
    </ShadowRootContext.Provider>
  );
}

/**
 * Returns the active ShadowRoot if wrapped in a ShadowRootProvider,
 * or undefined when outside any provider (e.g. inside extension popup).
 *
 * Returning undefined (not null) lets Radix apply its own documented default container.
 */
export function usePortalContainer(): HTMLElement | undefined {
  const context = React.useContext(ShadowRootContext);
  return (context as unknown as HTMLElement) ?? undefined;
}

/**
 * Evaluates whether an outside-pointer-down event originated inside the container
 * using its composed path, and calls preventDefault() if so.
 */
export function handleOutsidePointerDown(
  event: {
    preventDefault: () => void;
    detail?: { originalEvent?: { composedPath?: () => EventTarget[] } };
    composedPath?: () => EventTarget[];
  },
  container: HTMLElement | ShadowRoot | undefined,
): boolean {
  if (!container) return false;
  const originalEvent = event.detail?.originalEvent ?? event;
  const path =
    typeof originalEvent?.composedPath === "function"
      ? originalEvent.composedPath()
      : typeof event?.composedPath === "function"
        ? event.composedPath()
        : [];
  if (path.includes(container)) {
    event.preventDefault();
    return true;
  }
  return false;
}
