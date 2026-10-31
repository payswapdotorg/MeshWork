# TL Handoff — Meshwork Workspace UI Reproduction

**Status:** Authoritative implementation handoff  
**Scope:** Workspace shell, New Task, Connections, Connection Marketplace, navigation, and existing ZCode Settings behavior  
**Repository:** `payswapdotorg/MeshWork`  
**Figma Connection Marketplace frame:** [Open exact Figma frame — node 8:36](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36&t=apSw7DombY4XJVit-0)

---

## 1. Mission

Reproduce the Meshwork design shown in the supplied workspace and Connections references, using the existing ZCode application as the implementation foundation. Replace the Connection Marketplace page with the design in the Figma frame linked above. Fix all remaining text-contrast/readability defects. Make the Network navigation section appear immediately below Workspace.

**Do not redesign the rest of the product.** This is a faithful implementation task, not an invitation to invent a new visual system, reorganise every page, or replace ZCode conventions.

The governing rule for screens that already exist in ZCode is:

> **Keep the existing ZCode UI and its behaviour. Extend it only where Meshwork needs a new capability.**

This is especially important for Settings. Do not create a second Meshwork Settings implementation or a custom approximation of the screenshot. Use the existing ZCode Settings route, layout, navigation, sections, controls, persistence and platform behaviour.

The Figma Connection Marketplace frame is the sole visual authority for the Connection Marketplace page. Do not substitute the old HTML marketplace mockup or invent a different marketplace layout.

## 2. Design source hierarchy

Use the following sources in this order for their respective surfaces:

| Surface | Authoritative reference | Implementation rule |
|---|---|---|
| Workspace shell and New Task | User-supplied Meshwork/ZCode workspace screenshot and the approved dark Meshwork design | Reproduce the same visual hierarchy, spacing, panel arrangement and interactions. Preserve ZCode task/project/runtime behaviour. |
| Connections | The accepted dark Meshwork Connections design shown in the current design review, including its path cards, aggregation selector, metrics, traffic allocation and community panel | Preserve its composition and controls. Do not simplify, replace or re-theme it. |
| Connection Marketplace | [Figma node 8:36](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36&t=apSw7DombY4XJVit-0) | Inspect and reproduce this exact frame and its relevant component/interaction states. Figma overrides the legacy HTML marketplace mockup for this page only. |
| Settings and existing ZCode pages | The current upstream ZCode implementation and its existing settings screenshot/behaviour | Reuse the existing ZCode screens and routes. Do not replace them with the custom settings mockups from the chat preview. |
| Other existing ZCode capabilities | Current ZCode implementation | Retain them. Do not move them into a new Meshwork-specific navigation model unless explicitly specified here. |

### Figma inspection is mandatory for Marketplace

Before implementing Marketplace, the assigned worker must open the exact Figma file and node `8:36`, inspect the frame hierarchy and its component instances, and capture a local reference screenshot for visual QA. Inspect relevant child frames/components for details that are not clear from the parent frame. Use Figma's actual text, spacing, colours, card layout, iconography, and visual states. Do not infer or make up missing Marketplace UI.

Figma link:
`https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36&t=apSw7DombY4XJVit-0`

If access is temporarily unavailable, continue the other workstreams, but mark Marketplace as blocked on design inspection. Do not sign it off using the old HTML mockup as a substitute.

## 3. Workspace shell and navigation

### 3.1 Preserve the ZCode workspace shell

Retain the existing ZCode application shell and adapt its branding to Meshwork where required. Preserve the desktop window controls, navigation, task list, projects, user/profile area, task/session behaviour and right-side tool dock.

The New Task screenshot is the key reference for the desktop arrangement:

- Left workspace navigation pane.
- Central task workspace/composer.
- Right-side dock, showing Browser in the supplied screenshot.
- Existing top-level controls and the bottom profile/settings access.
- Existing projects and task list remain accessible.

Do not create a parallel shell, embedded WebView, or a second runtime.

### 3.2 Navigation order

Place the **Network** navigation group immediately after the **Workspace** group.

The intended top-level order is:

1. **Workspace:** New Task, Automations, Plugin Marketplace.
2. **Network:** Connections, Connection Marketplace, My Offers, Devices & Nodes, Group Buying.
3. Existing task-list/project navigation and profile elements remain available in the established ZCode shell. Keep their existing semantics; position them according to the approved reference layout, without hiding or deleting them.

Do not add a separate **Agent Capabilities** group to the normal workspace sidebar. Capabilities such as Memory, Subagents, Plugins, MCP Servers, Skills, Commands and Hooks are already represented in the existing ZCode Settings navigation and capability surfaces. Keep those in their existing ZCode locations.

### 3.3 M logo docking behaviour

The Meshwork **M logo at the top of the left navigation pane** is the sidebar docking control.

- Clicking M collapses/docks the left navigation pane to the compact icon rail (or the equivalent existing ZCode docked state).
- Clicking M again restores the full navigation pane.
- Preserve the current page, selected project, task composer contents and dock state across collapse/restore.
- Do not interpret M as a route to the home page.
- Provide an accessible tooltip/label and keyboard focus behaviour.

Use an existing ZCode sidebar-collapse/docking mechanism if available. Do not implement a second local-only state model if the application already persists or owns this state.

### 3.4 Network section interaction

Each Network entry navigates to its own page using the current application routing conventions. Active state, breadcrumbs/title, scroll behaviour and browser back/forward should work consistently with ZCode.

Do not use placeholder buttons for navigation or leave menu entries inert.

## 4. New Task page

Reproduce the supplied New Task screenshot and approved dark theme. It should feel like the existing ZCode agent workspace, not a separate network dashboard.

Preserve the following visible structure and interactions:

- Central greeting/introductory message.
- Project selector at the top of the composer.
- Main natural-language prompt field with existing ZCode prompt affordances (context mention, slash commands/capabilities where supported).
- Attachment control.
- Permission/access-mode selector. Preserve ZCode's existing permission model; do not silently grant full access.
- Model selector using ZCode's existing model-provider and model-selection services. Display the user's configured model (the screenshot shows GLM-5.3 Max as its selected example; do not hard-code that model).
- Submit/create-task control wired to the real ZCode task/session creation flow.
- Quick-action chips/cards in the reference layout (examples shown include Weekly Summary, Error Fix and PPT Creation). Use existing task templates/capability actions where available; do not show them as functional if they are not wired.
- Browser, Terminal and Devices controls in the existing top-right area and the dock arrangement shown in the reference.

The project selector must use the existing ZCode project service and assignment semantics. It must not be a decorative dropdown or a disconnected local array.

### Browser, Terminal and Devices

- Browser and Terminal retain independent visibility state; both must be able to remain open at the same time.
- Devices opens the device panel/view as shown by the product shell, without forcibly replacing or closing Browser/Terminal unless the existing ZCode interaction explicitly requires a tab switch.
- Switching tabs must not discard the other open panel.
- Preserve resize, maximize/restore and close controls provided by the ZCode dock/shell.
- Reuse ZCode's existing Browser and Terminal components and services. Do not create fake terminal/browser content as a replacement for the actual tools.

## 5. Connections page — preserve the accepted design

The Connections page must retain the full approved dark Meshwork aggregation layout. Do not replace it with a generic table, a basic device list or a simplified network dashboard.

### 5.1 Available paths

Retain the path-card design with, at minimum:

- Path/provider name and access type/interface.
- Download and upload rate shown separately.
- Latency and packet-loss/health information where available.
- Health status (healthy/degraded/high latency/offline).
- Per-path Use checkbox/enable control.
- Path diversity/correlation warning where appropriate.

Use actual path inventory and observations when implemented. Never present sample measurements as live data.

### 5.2 Aggregation strategy

Retain all five visual options:

1. Single path.
2. Load balance.
3. Bond.
4. Failover.
5. Redundancy.

Each option must expose a concise explanation and update the strategy description, estimate label and traffic allocation view. Reuse the existing network planner/control-plane contracts when available; UI selection must not directly mutate routing tables.

Preserve the technical distinctions:

- Multi-WAN load balancing distributes independent flows; it does not automatically accelerate one TCP flow.
- True single-session bonding requires a compatible multipath transport or tunnel and a compatible remote endpoint/relay.
- Failover changes paths when configured health conditions are breached.
- Redundancy can replicate selected traffic and consumes extra bandwidth.
- A provider pool and a group purchase are different concepts.

Do not calculate an aggregate speed by blindly adding advertised rates. Label estimates and measured throughput accurately, including relay/concentrator bottlenecks.

### 5.3 Preferences and estimates

Retain the **Optimise for** and **Maximum spend per day** selectors, selected-path count and estimated aggregate/goodput panel. Use labelled units and explain whether values are measured, estimated or provider-advertised.

If actual data is unavailable, present an explicit empty/unknown state. Do not ship sample values in production.

### 5.4 Traffic allocation and community connectivity

Keep the traffic-allocation table showing traffic class, preferred path, fallback and policy. Include the community-connectivity panel with actions to explore group buying and provider pools.

Preserve the original layout proportions and information hierarchy. Implement responsive behaviour without removing the table or core mode descriptions.

## 6. Connection Marketplace — use Figma, not the legacy mockup

Implement the Connection Marketplace exactly from the Figma frame at node `8:36`:

[Meshwork — Connection Marketplace frame](https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL/Meshwork-%E2%80%94-Agent-Workspace---Connectivity-Network?node-id=8-36&t=apSw7DombY4XJVit-0)

Requirements:

- Use the frame as the visual target: page composition, hierarchy, spacing, typography, colours, icons, cards, navigation and controls.
- Inspect child components/variants and any related frames used by this screen.
- Reuse existing ZCode shared components/design tokens where they can reproduce the Figma frame accurately.
- Wire controls to real Marketplace routes/data/services when available. Where the underlying service is not yet implemented, show a deliberate disabled/not-configured state, not a fake successful action.
- Distinguish buying access, provider directory/offer discovery, provider-supplied capacity, and group purchasing only as the Figma design specifies; do not invent extra tabs or sections.
- Include loading, empty, error and permission/eligibility states consistent with the design system. Do not invent visual variants absent from Figma; derive them from existing ZCode patterns and clearly document any necessary extension.
- Keep all payment, provider eligibility, cancellation, refund, and capacity-sharing actions behind their proper authority/approval flow. A visual button is not evidence of a working payment or network capability.

Do not use the old marketplace tabs/cards in `design/index.html` as a substitute for the Figma design. That legacy HTML is superseded for this page only.

## 7. Settings — preserve ZCode exactly

This is a critical constraint.

**Do not implement a new Meshwork Settings page. Do not copy the Settings screenshot into a new, parallel component. Do not replace existing ZCode settings routes, state or controls.**

Clicking the Settings gear must invoke the existing ZCode Settings navigation/route and retain its established UX:

- The workspace left pane is removed while Settings is open, as in the supplied ZCode screenshot.
- The Settings screen has its own existing left-side settings navigation and main settings content area.
- The existing Settings categories, panels, controls, values, tooltips, saves, switches, scroll behaviour and persistence remain intact.
- The existing **Back to workspace** action returns to the workspace and restores the left pane/docking state that was in effect before Settings opened.
- Preserve all existing ZCode settings areas, including Basics, Appearance, Model settings, Browser Use, Remote devices, Computer Use, Keyboard Shortcuts, Personalization, Memory, Subagents, Plugins, MCP Servers, Skills, Commands, Hooks and Data/Statistics sections, as present in the current upstream UI.
- Meshwork-specific settings should be added only through the existing ZCode settings extension pattern and only where genuinely required (for example, network adapter/privacy/permission settings). Do not duplicate existing concepts.

Acceptance means the original ZCode settings page still works. A visually similar recreation with missing settings, broken persistence or disconnected controls is a failure.

## 8. Text visibility and accessibility

Fix the previously observed invisible/low-contrast text issues without changing the overall dark design theme.

- Normal text must remain readable against every background: body copy, secondary labels, small captions, card descriptions, placeholder text, dropdown values, menu items, selected/unselected states, helper copy, table content, badges and tooltips.
- Use existing ZCode/Meshwork theme tokens wherever possible. Avoid ad hoc colour values scattered across pages.
- Meet WCAG 2.2 AA contrast targets where applicable: at least 4.5:1 for normal text and 3:1 for large text and meaningful UI graphics/components.
- Do not rely on opacity alone to create muted text; ensure the resulting foreground/background pair still has sufficient contrast.
- Test normal, hover, focus, selected, disabled, error and dark-theme states. Disabled text can be de-emphasised but must remain legible.
- Keyboard focus indicators must be visible. Inputs/selects must have visible labels and readable option menus.
- Check the actual rendered browser/desktop UI; do not rely only on static CSS inspection.

Keep the colour language from the approved design: charcoal/near-black surfaces, subtle borders, light grey text, muted periwinkle-blue emphasis, green healthy state and orange permission/warning state. Do not turn the product into a white theme or a dominant blue theme.

## 9. Existing ZCode capabilities and non-regression

The Meshwork product is an extension of ZCode, not a replacement. Preserve:

- Existing project and task lists/assignment.
- Task sessions, history and restore.
- Agent CLI/runtime, prompt context, commands and approvals.
- Model providers and model selection.
- Browser and integrated terminal.
- Automations.
- Plugin Marketplace, installed plugins and plugin execution flow.
- Memory, subagents, skills, hooks and MCP servers.
- Remote device and computer-use settings.
- Desktop window controls, dock behaviour, keyboard shortcuts and platform conventions.
- Existing web client and Electron desktop app.

Do not relocate or rebuild existing settings/capabilities merely to fit a new Meshwork navigation structure.

## 10. Implementation architecture and code rules

1. Reuse the existing ZCode React/UI components, state stores, route patterns, services, RPC/contracts, browser/terminal dock and settings framework.
2. Do not ship the HTML/AppBlock preview, iframe or embedded WebView as the application implementation. The previews are design references only.
3. Do not create a second project manager, task store, model selector, permissions engine, browser, terminal, settings system or plugin/subagent runtime.
4. Keep visual components separate from domain services. UI reads typed view models and dispatches typed commands; it does not perform privileged network operations.
5. Keep network path planning and aggregation calculations in deterministic domain/service code, with explicit validation and result explanations.
6. Do not introduce hard-coded example devices, paths, throughput or provider offers into production. Use fixtures only in tests/story/demo mode and label them.
7. Retain the existing permission model. Hotspot, relay, exit-node, guest access, resale and capacity sharing remain off by default and require explicit, scoped authorisation.
8. Reuse the existing app layout persistence for dock/sidebar states where supported. Do not persist duplicate or contradictory UI state.
9. Avoid dead controls. If an underlying service is not available, render an explicit disabled/not-configured state with an explanation.
10. Keep the repository as the source of truth. Implementation decisions, deviations, screenshots, tests and status must be documented in this repository, not in chat.

## 11. Team split — TL + three workers

### TL — integration, source audit and acceptance

- Confirm the current MeshWork repository state and upstream ZCode base revision before assigning code changes. The repo's current documentation indicates the ZCode fork/copy is a separate foundation milestone; do not assume the HTML prototype is production code.
- Map existing ZCode routes/components/stores/services for workspace shell, Settings, projects/tasks, browser/terminal dock and window controls.
- Approve the UI component/service boundaries and shared contracts.
- Own merge order, architecture decisions, CI, visual QA and end-to-end regression.
- Enforce the Settings reuse constraint and prevent a parallel Settings implementation.
- Maintain `docs/IMPLEMENTATION_PLAN.md` and milestone evidence.

### Worker 1 — workspace shell, New Task and navigation

- Reproduce the supplied New Task workspace screenshot in the existing ZCode shell.
- Wire the real project selector, task creation, permission mode and model selector.
- Implement the Network group immediately below Workspace.
- Implement M-logo sidebar collapse/restore using existing ZCode state/layout mechanisms.
- Preserve existing Projects, Task List, profile, window controls and tool dock.
- Ensure Browser, Terminal and Devices panels behave correctly and independently.
- Do not create a separate settings page; route the gear into the existing ZCode Settings view.

### Worker 2 — Connections page

- Reproduce the accepted Connections design exactly.
- Build/extend typed view models for path inventory, observations, mode availability, estimate provenance and traffic allocation.
- Implement the five mode selectors and their explanatory/summary states.
- Connect page actions to the network planner and approved command flows; never apply route changes directly from the view.
- Add responsive layout and visual regression tests.
- Keep fixture data out of production.

### Worker 3 — Connection Marketplace from Figma

- Inspect Figma file `gjiEUMQeKHL7pMNtuzM3FL`, exact frame `8:36`, and relevant children/components.
- Save a reference screenshot and record the inspected Figma node IDs in the PR.
- Reproduce the Figma Marketplace design using existing ZCode components and tokens where possible.
- Wire available service flows; show honest unconfigured/loading/empty/error states otherwise.
- Add visual regression and interaction tests for the Marketplace page.
- Do not use the legacy Marketplace section in `design/index.html` as the final design.

### Parallelisation and integration order

1. TL establishes/validates the ZCode codebase and identifies reusable shell/settings/dock contracts.
2. Worker 1 builds against those contracts; Worker 2 and Worker 3 can develop page components in parallel behind agreed route and view-model interfaces.
3. TL integrates all three, runs desktop and web checks, then performs screenshot comparison.
4. No worker may make broad theme, routing or Settings refactors outside this scope without TL approval.

## 12. Acceptance tests

### Workspace and navigation

- [ ] App launches into the Meshwork New Task workspace using the intended ZCode shell.
- [ ] Workspace group is above Network; Network is immediately below Workspace.
- [ ] Clicking every navigation item opens the correct page and updates active state/breadcrumb.
- [ ] Existing Projects and Task List remain accessible and functional.
- [ ] Clicking M collapses/docks the left pane; clicking M again restores it.
- [ ] M toggling does not lose the current page, selected project, typed prompt or open Browser/Terminal states.
- [ ] Keyboard shortcut for New Task still works.

### New Task

- [ ] Project selector reads/writes through existing ZCode project services.
- [ ] Prompt uses existing ZCode task/session creation.
- [ ] Model selector lists configured models and preserves current model/provider logic.
- [ ] Permission/access selector uses the existing permission model.
- [ ] Quick actions invoke actual templates/capabilities or are clearly unavailable.
- [ ] Browser, Terminal and Devices use their existing components/services.
- [ ] Browser and Terminal may remain open together; switching does not discard the other pane.
- [ ] Dock resize/close/maximise/restore works on desktop and adapts to web.

### Connections

- [ ] Visual comparison matches the accepted Connections reference (page structure, panel hierarchy, cards, controls, labels, typography, spacing and colour).
- [ ] All five modes are present and selection updates explanation, estimate label and allocation table.
- [ ] Path enable/disable state updates selected-path count.
- [ ] Optimisation and budget selectors are present and usable.
- [ ] Values are correctly labelled as measured, advertised or estimated.
- [ ] No unsupported claim that load balancing accelerates a single TCP transfer.
- [ ] Community links navigate to group buying and provider offers.
- [ ] Production UI does not display mock device/path/provider values.

### Connection Marketplace

- [ ] Implemented against Figma frame `8:36`, with screenshot comparison evidence.
- [ ] No legacy HTML mockup substituted for the Figma page.
- [ ] Visible controls are wired or explicitly disabled with a reason.
- [ ] Empty/loading/error states are implemented and do not invent provider inventory.
- [ ] Provider/payment/sharing operations respect their approval and eligibility rules.

### Settings non-regression

- [ ] Settings opens the existing ZCode Settings route/component, not a new Meshwork screen.
- [ ] Workspace left pane is removed while Settings is open, as in the current ZCode behaviour.
- [ ] Existing Settings sidebar and all pre-existing sections/settings work and persist.
- [ ] Back to workspace returns to the previous workspace page and restores its previous sidebar dock state.
- [ ] No duplicate Agent Capabilities navigation is added to the workspace sidebar.

### Accessibility and visual verification

- [ ] Text contrast meets WCAG 2.2 AA targets where applicable.
- [ ] Small labels, placeholders, secondary text, badges, dropdown options and disabled states are visibly legible.
- [ ] Keyboard tab order and focus indicator are visible and usable.
- [ ] Visual screenshots captured for New Task, Connections, Marketplace, Settings and collapsed-sidebar state.
- [ ] Compare against the correct reference for each page; do not use a single screen's screenshot as a general proxy.
- [ ] No visual regression to the existing ZCode Settings page or other in-scope ZCode surfaces.

### Build and quality

- [ ] Existing ZCode unit, integration and E2E suites pass, or pre-existing failures are documented with evidence.
- [ ] New tests cover navigation, sidebar persistence, dock combinations, page interactions, Connections mode states and Marketplace interactions.
- [ ] Linux and Windows desktop build/package still work; web app still builds.
- [ ] No dead buttons, console errors, broken routes, hard-coded production fixtures or new duplicate state systems.

## 13. Evidence required in the TL completion report

For every acceptance group include:

- Changed file paths and the responsibility of each change.
- Reused ZCode components, routes, stores, services and settings patterns (with source paths).
- Figma node IDs inspected and a screenshot of the Marketplace reference.
- Before/after screenshots for New Task, Connections, Marketplace, Settings and collapsed sidebar.
- Contrast audit results and any exceptions.
- Automated test commands, pass/fail counts and relevant CI run links.
- Desktop/web build and installer verification.
- Explicit list of remaining gaps, unavailable backend integrations and risks.

Do not mark visual implementation complete because a preview renders, a branch compiles, or a screenshot looks plausible. Completion requires functional interaction, ZCode non-regression and evidence against the correct references.

---

## 14. Current repository context and status discipline

The MeshWork repository currently contains product documentation and HTML design prototypes; the repository README marks the ZCode fork/copy and production UI integration as pending. The TL must verify the live repository state before execution and must not present a prototype or mock state as implemented product functionality.

This handoff supersedes conflicting older design instructions that say the legacy HTML Marketplace or a custom Meshwork Settings mockup is authoritative:

- The legacy HTML Marketplace is not the final Marketplace design.
- The custom Settings mockup from the preview is not to be implemented.
- Existing ZCode Settings is to be retained.
- The accepted New Task and Connections design references remain in scope.
