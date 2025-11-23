---
description: 'Create Functional Documentation: Technical Implementation from a PR'
applyTo: '**/*'
---
# Technical Documentation Instructions
## Invocation

When the user writes `/documentation` in a PR conversation, generate a technical documentation file based on the PR content. Use the PR number, title, author, branch, description, comments, labels, and “Files changed” tab **if available in the editor context**.

Review if in the Notion 'Board Game Assistant Intelligence' workspace there is a page titled 'ABG-XXXX' at the URL below. If it exists, Revise that page with the generated documentation. If it does not exist, create a new page with the documentation. If new changes are made, update the page accordingly.
[{"title":"Board Game Assistant Inteligence","url":"https://www.notion.so/2b44600cdbc08060a12cfba70fbef4f5"}]

**Output format:** Produce a single Markdown document in folder `/docs`, following the template below. Keep language **concise and factual**. Do **not** invent details you can’t infer from the PR.
- name: BGA-XXXX_<name>.md (BGA-XXXX: US number - name:short descriptive title).

---

### Header

# [US_NUMBER]:: NAME

## Overview

**Pull Request**:   
**Title**:
**Author**: Camilo Ramirez
**Target Branch**:

- **Pull Request / Title / Author / Target Branch**: Extract from PR metadata.

## Summary
Scope: <what is covered>
Expected outcome: <state/behavior after merge>
Risk/Impact: <low/medium/high + reason>

- Keep it to **5–8 bullet lines** max. Be specific (features, flows, services).

## Modified Files (Paths)
- Build from “Files changed” (path + change type).
- **Module/Component**: map path prefix to subsystem (e.g., `api/`, `ui/`, `jobs/`, `infra/`, `migrations/`).
- **Brief reason**: 4–10 words (e.g., “add validation”, “fix null handling”, “new endpoint”).

## Detailed Changes
Break down by concern.

## Other sections (as applicable)

## END
End of Technical Documentation for [US_NUMBER] - GitHub Copilot
---



