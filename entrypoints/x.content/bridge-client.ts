export interface GraphqlShape {
  method: string;
  urlPath: string;
  operationName: string;
  docId: string;
  topLevelResponseKeys: string[];
  entryCount: number;
}

export interface BridgeNavigate {
  url: string;
}

type GraphqlHandler = (shape: GraphqlShape) => void;
type NavigateHandler = (nav: BridgeNavigate) => void;

const graphqlHandlers: GraphqlHandler[] = [];
const navigateHandlers: NavigateHandler[] = [];

let bridgeStarted = false;

export function onGraphqlShape(handler: GraphqlHandler): () => void {
  graphqlHandlers.push(handler);
  return () => {
    const idx = graphqlHandlers.indexOf(handler);
    if (idx !== -1) graphqlHandlers.splice(idx, 1);
  };
}

export function onBridgeNavigate(handler: NavigateHandler): () => void {
  navigateHandlers.push(handler);
  return () => {
    const idx = navigateHandlers.indexOf(handler);
    if (idx !== -1) navigateHandlers.splice(idx, 1);
  };
}

export async function startBridge(): Promise<void> {
  if (bridgeStarted) return;
  bridgeStarted = true;

  try {
    await injectScript('/bridge.js', {
      keepInDom: true,
      modifyScript(script: HTMLScriptElement) {
        script.addEventListener('bt:graphql', (event: Event) => {
          const customEvent = event as CustomEvent<GraphqlShape>;
          if (customEvent.detail) {
            for (const handler of graphqlHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });

        script.addEventListener('bt:navigate', (event: Event) => {
          const customEvent = event as CustomEvent<BridgeNavigate>;
          if (customEvent.detail) {
            for (const handler of navigateHandlers) {
              try {
                handler(customEvent.detail);
              } catch {
                // Ignore handler errors
              }
            }
          }
        });
      },
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[bt:spike] Failed to inject bridge script', err);
    }
  }
}
