# Figma concept — secondary reference only

The current product decision is to use the runnable HTML design at [design/index.html](../design/index.html) as the canonical visual and interaction reference for Meshwork's main pages.

Figma file: https://www.figma.com/design/gjiEUMQeKHL7pMNtuzM3FL

The three-page Figma concept was authored before the HTML-first decision. Keep it as an optional visual exploration and source of component ideas, but do not use it as the implementation source of truth, do not block implementation on Figma updates, and do not resolve disagreements in favor of Figma.

For requirements and current implementation guidance see:
- [HTML design and run instructions](../design/README.md)
- [Main README](../README.md)
- [Architecture](ARCHITECTURE.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)

The HTML design is itself a prototype. Its local interactions are not backend integrations. Implement the pages with existing ZCode React UI primitives, semantic Zai themes/tokens, services/hooks, project/task state and platform APIs. Do not ship it as a WebView replacement.