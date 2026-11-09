---
name: validate-non-english-locales-w-official-ref
description: "Validate non-English Web Extension locale terminology and wording against official Mozilla Firefox localization references (Pontoon/l10n-central/searchfox) for French, Hebrew, Japanese, and other locales. Use for read-only auditing and mismatch reporting only; no file edits."
argument-hint: "Locale files or key set to audit for official Mozilla terminology/wording alignment"
user-invocable: true
---

# Validate Non-English Locales With Official Mozilla Terminology Reference

## What This Skill Produces
- A read-only audit report of locale keys whose terminology and/or wording may not match official Mozilla Firefox localization.
- Per-key evidence notes (English source context + Mozilla reference path/context used).
- A confidence level per finding (high/medium/low) based on reference match quality.
- No file edits and no automatic fixes.

## Hard Constraint
- This skill must not modify files.
- Do not apply patches, do not rewrite locale values, and do not run formatters.
- Output findings only.

## When To Use
- You want to check if localized UI terms match official Firefox vocabulary.
- You have recently added or changed locale keys and want terminology QA before editing.
- You want candidate mismatches for manual review in locale files.

## Required Inputs
- English source file: Sage-Like/_locales/en/messages.json.
- Target locale files to validate, for example:
  - Sage-Like/_locales/fr/messages.json
  - Sage-Like/_locales/he/messages.json
  - Sage-Like/_locales/ja/messages.json
- Optional narrowed scope:
  - Specific key names (for example js_panelChooseContainerTitle)
  - Specific domains (for example container/tab/window/permission labels)

## Procedure
1. Determine audit scope.
- Use the provided key list if given.
- Otherwise, focus on keys likely to carry official UI terminology (containers, tabs, windows, permissions, menu actions).

2. Collect candidate keys from locale files.
- Read selected locale files and extract key/value pairs in scope.
- Keep a mapping: locale key -> English source text -> localized text.

3. Map each candidate to Firefox UI concept.
- Infer intended concept from English source meaning and UI context.
- Confirm runtime usage context where needed (for example context-menu labels vs panel captions).

4. Verify against official Mozilla references (read-only).
- Preferred lookup workflow:
  1) Searchfox (mozilla-central) for the English source key/text and context.
  2) l10n-central locale repos or Pontoon for the corresponding translated wording.
- Official reference resources:
  - Pontoon: https://pontoon.mozilla.org/
  - Searchfox: https://searchfox.org/mozilla-central/
  - l10n-central FR: https://hg.mozilla.org/l10n-central/fr/
  - l10n-central HE: https://hg.mozilla.org/l10n-central/he/
  - l10n-central JA: https://hg.mozilla.org/l10n-central/ja/

5. Assess alignment and classify findings.
- Mark as Potential Mismatch when either is true:
  - Core term differs from official Firefox term for same concept.
  - Wording structure conflicts with common official UI phrasing in same context.
- Mark as Acceptable Variant when:
  - Grammar/context adaptation is needed but core terminology aligns.
- Mark as Inconclusive when:
  - No reliable Mozilla equivalent is found for the same context.

6. Produce a findings report (no edits).
- Report only keys needing review (Potential Mismatch + optionally Inconclusive).
- Use the output format below.

## Output Format
For each finding, include:
- Locale: <fr|he|ja|...>
- Key: <message key>
- Current value: <current localized string>
- Suggested official term/wording: <reference-aligned candidate>
- Evidence:
  - Mozilla English context: <searchfox file/key or context>
  - Mozilla localized reference: <pontoon/l10n-central path or key/context>
- Reason: <why this may not match official terminology>
- Confidence: <high|medium|low>

Then add:
- Summary counts by locale (potential mismatches / inconclusive / checked)
- Explicit note: "No files were edited."

## Decision Points
- If the same concept has multiple official variants across Firefox surfaces:
  - Prefer variant matching the closest UI context (menu item, button label, dialog title, etc.).
- If no direct equivalent exists in Mozilla sources:
  - Mark Inconclusive (do not force a mismatch).
- If localized text differs stylistically but preserves official core term:
  - Mark Acceptable Variant, not mismatch.

## Quality Criteria
- Read-only behavior enforced (no edits).
- Each reported mismatch includes verifiable Mozilla evidence.
- Findings distinguish clear mismatches from inconclusive cases.
- Report is actionable for manual follow-up editing.

## Completion Checklist
- Audited requested locale files and keys.
- Verified terminology/wording against Mozilla references where possible.
- Produced per-key evidence-backed findings list.
- Included confidence and summary counts.
- Confirmed no files were edited.

## Example Prompts
- Audit fr/he/ja container-related strings and list potential mismatches with official Firefox wording.
- Validate terminology for permission-related messages in non-English locales; report keys that may diverge from Mozilla.
- /validate-non-english-locales-w-official-ref Check keys js_panelChooseContainerTitle and htm_panelContextMenuOpenNewContainerTab in fr/he/ja and output only evidence-backed mismatch findings.
