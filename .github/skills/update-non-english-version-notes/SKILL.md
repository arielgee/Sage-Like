---
name: update-non-english-version-notes
description: "Translate and synchronize AMO product-page version notes from .misc/amo-product-pages/en-English.md to non-English files (fr, he, ja, and other locales). Use when version notes text or version number changes and locale formatting must be preserved."
argument-hint: "Target locales to update (default: fr, he, ja)"
user-invocable: true
---

# Update Non-English Version Notes

## What This Skill Produces
- Updated version-note content under the heading `Manage Version x.xx ➜ Version Notes` in non-English AMO product-page files.
- Synchronized version number in the same heading across locale files.
- Localized text inside the fenced `markdown` code block that matches the latest English source meaning.
- Preserved formatting and style markers from the English source block.

## When To Use
- `.misc/amo-product-pages/en-English.md` version notes were changed.
- A release version number changed and locale headings must match.
- Non-English AMO listing files are missing or out-of-date in the version-notes section.

## Required Inputs
- Source file: `.misc/amo-product-pages/en-English.md`
- Target files (default set):
  - `.misc/amo-product-pages/fr-French.md`
  - `.misc/amo-product-pages/he-Hebrew.md`
  - `.misc/amo-product-pages/ja-Japanese.md`

## Procedure
1. Extract the source section from English.
- Find heading: `## Manage Version x.xx ➜ Version Notes – (_HTML w/ some Markdown_)`.
- Read only the text inside the following fenced code block labeled `markdown`.
- Capture:
  - Heading version number (`x.xx`)
  - The code-block body (including `**Changes**`, bullets, punctuation, line breaks).

2. Update each target locale heading version.
- In each non-English target file, find the same `Manage Version x.xx ➜ Version Notes` heading.
- Replace only the version number so it matches the English source.

3. Translate and update code-block content for each locale.
- Translate the English version-note text into each target language.
- Keep the same structure as English:
  - Keep fenced block language as `markdown`.
  - Keep heading emphasis and list markers (`**...**`, `* ...`).
  - Preserve URL strings, punctuation patterns, and line-flow where practical.
- Do not alter unrelated sections in the locale file.

4. Preserve mandatory non-translation constraints.
- Do not translate the extension name: `Sage-Like`.
- Do not translate or modify fenced code block syntax highlighting token: `markdown`.

5. Validate and review.
- Confirm each target file has:
  - Matching heading version number with English.
  - Fully translated version-notes text inside the code block.
  - No placeholder/TODO text in the version-notes block.
- Do not run project validation tasks as part of this skill.
- Specifically, do not run the task `Validate-i18n`.
- Validation for this skill is limited to file-content checks in the target locale files.

## Decision Points
- If a target locale file is missing the heading:
  - Add the missing heading and a properly fenced `markdown` block in the expected location, using the file's existing style.
- If locale text requires grammar-aware restructuring:
  - Prioritize natural language output while preserving the bullet-by-bullet meaning.
- If punctuation/RTL rendering is unstable (for example Hebrew mixed with Latin terms):
  - Keep or add directional marks only where needed for stable display.

## Quality Criteria
- Version number parity with English heading in all updated locale files.
- Semantic parity for every bullet item in the code block.
- Preserved markdown formatting and styling tokens.
- `Sage-Like` and fenced language token `markdown` remain unchanged.

## Completion Checklist
- Updated all requested locale files.
- Synchronized `Manage Version x.xx` heading version across locales.
- Translated only version-notes text content in the fenced block.
- Preserved formatting and mandatory non-translation constraints.
- Completed file-content validation pass (without running `Validate-i18n`).

## Example Prompts
- Update non-English version notes from en-English.md for the latest release.
- Sync Manage Version heading and translate version notes for fr, he, and ja.
- Apply update-non-english-version-notes for version 3.15 and preserve markdown formatting.
