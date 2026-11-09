---
name: update-non-english-locales-w-official-ref
description: "Translate and synchronize non-English Web Extension locale entries from Sage-Like/_locales/en/messages.json, then verify key terminology against official Mozilla Firefox localization references (Pontoon/l10n-central/searchfox) for French, Hebrew, Japanese, and other locales. Use when keys are added/changed/removed and when concatenated i18n strings must remain natural."
argument-hint: "Source keys and target locale files to update, with official terminology verification"
user-invocable: true
---

# Update Non-English Locales With Official Mozilla Terminology Reference

## What This Skill Produces
- Updated target locale message entries that match selected English source keys.
- Correct handling of added, changed, and removed keys.
- Grammatically correct output for concatenated runtime strings in each target language.
- Terminology and wording aligned to official Mozilla Firefox localization where applicable.
- A validated i18n result using the repository checker.

## When To Use
- English strings in Sage-Like/_locales/en/messages.json changed.
- Matching keys in non-English locale files must be synchronized.
- A JavaScript file concatenates multiple i18n parts and wording must remain natural in each language.
- UI terms should match official Firefox vocabulary (for example Containers, tab, window, permission names).

## Required Inputs
- English source file: Sage-Like/_locales/en/messages.json.
- Target locale files to update, for example:
  - Sage-Like/_locales/fr/messages.json
  - Sage-Like/_locales/he/messages.json
  - Sage-Like/_locales/ja/messages.json
- JavaScript usage site(s) where messages are concatenated, for example Sage-Like/permissions/requiredPermissions.js or Sage-Like/sidebar/panel.js.

## Procedure
1. Identify the exact source key set in English.
- Capture the selected key block and final meaning (not only literal wording).
- Detect whether keys were added, removed, renamed, or semantically rewritten.

2. Inspect how the keys are consumed at runtime.
- Read the JavaScript concatenation logic and punctuation/spaces/newlines between segments.
- Determine fixed separators injected by code (for example leading/trailing spaces around quoted permission names).

3. Draft translations per target language with concatenation-awareness.
- Translate each key so the final concatenated sentence reads naturally in the target language.
- If grammar requires rebalancing, shift wording between part1/part2/part3 while keeping the same key contract.
- Preserve exact permission labels or other UI terms that must match browser wording.

4. Verify official Mozilla terminology and wording.
- For each term that likely maps to Firefox UI vocabulary (for example Container, New Tab, Private Window, permission labels):
  - Locate the English source term in Mozilla references first.
  - Find the corresponding localized term in official Mozilla localization resources.
- Preferred lookup workflow:
  1) Searchfox (mozilla-central) to identify the English key and context.
  2) l10n-central locale repos or Pontoon to confirm translated wording for the same key/context.
- Official reference resources:
  - Pontoon: https://pontoon.mozilla.org/
  - Searchfox: https://searchfox.org/mozilla-central/
  - l10n-central FR: https://hg.mozilla.org/l10n-central/fr/
  - l10n-central HE: https://hg.mozilla.org/l10n-central/he/
  - l10n-central JA: https://hg.mozilla.org/l10n-central/ja/
- Important scope note:
  - Firefox UI localization is primarily in .ftl (and some .properties/.dtd), not messages.json.
  - Reuse Mozilla wording only when context matches. Prefer product clarity if no exact Firefox context exists.

5. Apply structural synchronization.
- Add newly required keys.
- Update existing matching keys.
- Remove obsolete keys when they are no longer referenced or present in English.
- Keep JSON structure/style consistent with the file.

6. Validate and fix.
- Run: node .tools/validate-i18n.js
- Resolve missing/extra key errors and syntax problems.
- Re-check concatenated sentence flow in each language after validation passes.

## Decision Points
- If English removes a key (for example old part4):
  - Remove the same key from target locales unless it is still required by code.
- If a direct translation sounds unnatural after concatenation:
  - Prefer natural full-sentence output over rigid literal mapping of segment boundaries.
- If quoted inserted text causes agreement issues:
  - Adjust surrounding segments (part1/part2) to restore grammar.
- If official Mozilla wording conflicts with local extension context:
  - Keep official terminology for the core UI concept (e.g., Container), but adapt grammar around it for natural sentence flow.
- If no reliable official equivalent is found:
  - Keep the best natural translation and document that no direct Firefox UI reference was found.

## Quality Criteria
- Key parity with English for the edited scope.
- No orphan or stale keys for that scope.
- Natural grammar in concatenated output for every updated language.
- Official Mozilla terminology verified for relevant UI concepts.
- validate-i18n reports zero errors.

## Completion Checklist
- Updated all requested target locale files.
- Confirmed removed keys were deleted where required.
- Verified concatenated phrasing reads correctly in each updated language.
- Verified terminology for relevant keys against Mozilla references.
- Ran i18n validation successfully.

## Example Prompts
- Update fr, he, and ja locale keys for the permissions text block based on the latest English messages and remove obsolete keys. Verify official Firefox terminology for permission labels.
- Synchronize changed English keys in messages.json to all non-English locales under Sage-Like/_locales, ensure concatenated grammar, and verify Mozilla wording for UI terms.
- English changed container-related panel strings. Translate fr/he/ja and align terms with Mozilla Firefox localization references.
- /update-non-english-locales-w-official-ref In the Sage-Like/_locales/en/messages.json file the keys "js_x", "js_y" and "js_z" were added. Synchronize to all non-English locales and verify terminology against Mozilla references.
