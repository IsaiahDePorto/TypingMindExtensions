# TypingMind Development Context for Jules

This repository contains TypingMind extensions and plugins. Use the following documentation and reference links to ensure all code adheres to the latest TypingMind standards and API schemas.

## Core Documentation
- **Extensions Guide:** https://docs.typingmind.com/typingmind-extensions
- **Plugins Development:** https://docs.typingmind.com/plugins/build-a-typingmind-plugin
- **Main Documentation:** https://docs.typingmind.com

## Technical References & Schemas
- **Plugin JSON Schema:** https://docs.typingmind.com/plugins/typingmind-plugin-json-schema
- **Interactive Canvas (Artifacts) Spec:** https://github.com/TypingMind/plugin-interactive-canvas/blob/main/plugin.json
- **Official Examples Repo:** https://github.com/TypingMind/awesome-typingmind

## Extension Implementation Guidelines
1. **Sandboxing:** All JavaScript logic for extensions runs in the browser context. Ensure code is compatible with modern browser APIs.
2. **Accessing App Data:** Use the `typingmind` global object for interacting with the UI and chat data where applicable.
3. **Plugin Implementation:** 
   - Prefer **JavaScript** implementation for client-side logic.
   - For server-side needs, reference the self-hosted server model: https://github.com/TypingMind/plugins-server
4. **Interactive Canvas:** When generating HTML for the Interactive Canvas (Artifacts), ensure the output is a self-contained string that can be rendered within an iframe.

## Research Task for Jules
If a task involves a feature not fully detailed in the repository, use your internet access to research the specific section of the TypingMind Docs related to that feature (e.g., "Permissions & Resources Access" or "Custom Output Options").
