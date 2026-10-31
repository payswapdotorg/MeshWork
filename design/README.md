# Meshwork HTML design

The HTML prototype is the canonical design reference for the main Meshwork pages.

## Run locally

Open index.html directly in a current desktop browser. It has no build step, package dependencies, remote CDN assets or network requirement.

## Included screens

- New Task: ZCode-shaped workspace with project selector, intent composer and separately toggleable Browser and Terminal docks.
- Connections: WAN inventory, measured-versus-advertised information, multi-WAN, failover, traffic policy and the single-flow bonding distinction.
- My Nodes: node state and default-off capability grants.
- Marketplace: buying access, selling capacity and group purchasing.
- Tasks, Automations and Settings: navigation continuity with the existing workspace.

## Prototype behavior

Navigation, project selection, Browser/Terminal dock toggles, example prompts, marketplace tabs and the sharing-consent preview work locally. Buttons that would need a real runtime, network adapter, payment provider or coordinator intentionally identify themselves as prototype-only; they do not claim to perform those actions.

## Implementation rule

Use this HTML as the primary visual/interaction reference when implementing the main pages in the ZCode/React application. Reuse actual ZCode components, design tokens, project/task services, browser/terminal dock state and platform abstractions. Do not port the HTML as an embedded WebView replacement for the native/shared React UI.

The Figma concept remains a secondary visual reference only. It is not the design sign-off gate.
