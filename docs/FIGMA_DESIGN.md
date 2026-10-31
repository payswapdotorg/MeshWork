# Figma design specification

Figma file: https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL

The file uses three pages because the connected Figma Starter plan currently limits the file to three pages. Screens are authored as editable native Figma frames/text/components, not as full-screen raster images.

## Page 1 — New Task Workspace

Primary default screen. Keep the familiar ZCode workspace feel and existing capabilities:
- task/project navigation on left;
- New Task entry and project selector visible;
- natural-language composer as the focus;
- model selector and permission/approval control;
- attach context, commands, agent plan, examples;
- Browser and Terminal as independent top-right dock controls;
- browser/terminal can be open together, closed independently, resized and maximized;
- task execution status and node state are visible without overwhelming the composer;
- Connections, My Nodes, Group Buying and Marketplace are reachable without displacing existing task and project behavior.

The project selector is not optional. Preserve ZCode project assignment and allow tasks to be created into the currently selected project.

## Page 2 — Connections & Aggregation

- show local WAN links with source/interface, state, advertised and measured speeds, data-metering/cost status, latency/loss/health freshness;
- label the current aggregation mode;
- show separate controls for multi-WAN flow balancing, policy routing, failover and true single-flow bonding;
- disclose when bonding requires a compatible peer/relay;
- show traffic-class routing and policies;
- display relay status separately from local WAN links;
- include provider/connection add flow and diagnostics;
- never sum plan rates and display that sum as measured user bandwidth.

## Page 3 — Marketplace & Community

- tabs for buying connectivity, offering spare capacity and group purchasing;
- search/filter offers by location, speed, usage cost, provider, time and capabilities;
- separate advertised capacity from current measured path telemetry;
- provider/operator reputation must be evidence-based;
- sharing is visibly OFF by default;
- offer UI requires capacity budget, data cap, schedule, customer/guest isolation and explicit ISP permission state;
- group buying shows member count, threshold, quote, expiry, commitment rules and refund conditions;
- label demo/sample data in prototype screens; production listings must be live service data.

## Visual system and source-code alignment

Use the existing ZCode design system in the implementation:
- semantic color tokens and Zai Light/Zai Dark themes;
- text-ui-* typography scale; avoid arbitrary font classes/inline font sizes;
- use shared UI components and services/hooks, not new isolated design primitives;
- preserve keyboard-first density, localization and desktop/web parity;
- retain Windows/Linux window controls and Browser/Terminal title/dock interactions.

The Figma file uses Inter and dark surfaces for this first concept and imports Material 3 controls (Button, Text field, Tabs, Switch, Horizontal card, Icon button). Align implementation with ZCode's actual existing UI primitives; Figma library nodes are references, not a mandate to replace the codebase's component library.

## Interaction requirements

- Browser toggle opens/closes Browser without affecting Terminal.
- Terminal toggle opens/closes Terminal without affecting Browser.
- Project selector changes the project for the new task.
- Create task submits through the existing ZCode task/session service.
- Agent plan presents proposed steps and allows approval/edits before side effects.
- Connection toggle requires owner approval and displays exactly what capability is being enabled.
- Single-flow bonding is unavailable until endpoint/relay requirements are satisfied.
- Selling capacity stays disabled until provider eligibility and owner limits are confirmed.
- Join group buy shows full price/terms and requires explicit financial confirmation.

## Visual QA gate

The design file has been composed, but an exported screenshot/post-build visual QA pass is not yet available because the Figma Starter plan reached its MCP tool-call quota. Before declaring design sign-off:
1. Render each page at desktop size and inspect clipping/overlap.
2. Check colors/contrast and type scale against the product's active Zai themes.
3. Validate project selector and Browser/Terminal control hierarchy.
4. Validate narrow desktop window behavior and web layout.
5. Record the reviewed screenshot/version in the repo.