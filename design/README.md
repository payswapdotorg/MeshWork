# Meshwork HTML design prototype

This HTML file is a legacy standalone concept/prototype, not the production app and not the final authority for every current page.

## Current design authority

Follow [the TL handoff](../docs/TL_HANDOFF_DESIGN_REPRODUCTION.md) for the current approved design and acceptance rules.

- New Task/workspace: reproduce the user-approved Meshwork/ZCode workspace reference while reusing ZCode components and services.
- Connections: preserve the accepted dark Meshwork aggregation design. Do not simplify it.
- Connection Marketplace: use the exact [Figma frame 8:36](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36&t=apSw7DombY4XJVit-0), not the older marketplace cards/tabs in this HTML.
- Settings and existing capability pages: retain the native ZCode UI, routes and persistence. Do not recreate Settings from this HTML or from a chat preview.

## Run the legacy prototype

Open `index.html` directly in a current desktop browser. It has no build step, package dependencies, remote CDN assets or network requirement.

## Implementation rule

Use the prototype only as a source of earlier interaction ideas where it does not conflict with the current TL handoff. Production implementation must use the existing ZCode React components, design tokens, hooks, services, stores and platform APIs. Do not embed this HTML in a WebView as a substitute for the application UI.
