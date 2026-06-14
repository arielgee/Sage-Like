---
name: update-non-english-locales
description: "Translate and update non-English Web Extension locale entries from Sage-Like/_locales/en/messages.json. Use when keys are added/changed/removed and when concatenated i18n strings must stay grammatically correct per language (French, Hebrew, Japanese, and other locales)."
argument-hint: "Source keys and target locale files to update"
user-invocable: true
---

# Update Non-English Locales From English Source

## What This Skill Produces
- Updated target locale message entries that match selected English source keys.
- Correct handling of added, changed, and removed keys.
- Grammatically correct output for concatenated runtime strings in each target language.
- A validated i18n result using the repository checker.

## When To Use
- English strings in Sage-Like/_locales/en/messages.json changed.
- Matching keys in non-English locale files must be synchronized.
- A JavaScript file concatenates multiple i18n parts and wording must remain natural in each language.

## Required Inputs
- English source file: Sage-Like/_locales/en/messages.json.
- Target locale files to update, for example:
  - Sage-Like/_locales/fr/messages.json
  - Sage-Like/_locales/he/messages.json
  - Sage-Like/_locales/ja/messages.json
- The JavaScript usage site(s) where messages are concatenated, for example Sage-Like/permissions/requiredPermissions.js.

## Procedure
1. Identify the exact source key set in English.
- Capture the selected key block and final meaning (not only literal wording).
- Detect whether keys were added, removed, renamed, or semantically rewritten.

2. Inspect how the keys are consumed at runtime.
- Read the JavaScript concatenation logic and punctuation/spaces/newlines between segments.
- Determine fixed separators injected by code (for example leading/trailing spaces around quoted permission names).

3. Translate per target language with concatenation-awareness.
- Translate each key so the final concatenated sentence reads naturally in the target language.
- If grammar requires rebalancing, shift wording between part1/part2/part3 while keeping the same key contract.
- Preserve exact permission labels or other UI terms that must match browser wording.

4. Apply structural synchronization.
- Add newly required keys.
- Update existing matching keys.
- Remove obsolete keys when they are no longer referenced or present in English.
- Keep JSON structure/style consistent with the file.

5. Validate and fix.
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

## Quality Criteria
- Key parity with English for the edited scope.
- No orphan or stale keys for that scope.
- Natural grammar in concatenated output for every updated language.
- validate-i18n reports zero errors.

## Completion Checklist
- Updated all requested target locale files.
- Confirmed removed keys were deleted where required.
- Verified concatenated phrasing reads correctly in each updated language.
- Ran i18n validation successfully.

## Example Prompts
- Update fr, he, and ja locale keys for the permissions text block based on the latest English messages and remove obsolete keys.
- Synchronize changed English keys in messages.json to all non-English locales under Sage-Like/_locales and ensure concatenated grammar is correct.
- English changed part1-part3 wording in a concatenated warning text. Translate and adapt locale segments so final runtime sentences are natural.