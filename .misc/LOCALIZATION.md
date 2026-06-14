# Localization Guide for Sage-Like

This document provides comprehensive instructions for translating Sage-Like into different languages and maintaining the internationalization (i18n) system.

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Adding a New Translation](#adding-a-new-translation)
4. [Message Format](#message-format)
5. [Naming Conventions](#naming-conventions)
6. [Using Placeholders](#using-placeholders)
7. [HTML Internationalization](#html-internationalization)
8. [JavaScript Internationalization](#javascript-internationalization)
9. [Testing Translations](#testing-translations)
10. [Validation](#validation)
11. [Best Practices](#best-practices)

## Overview

Sage-Like uses the official Mozilla **browser.i18n API** for internationalization. This API provides a robust mechanism for translating strings in both HTML and JavaScript code.

All translatable strings are stored in `messages.json` files under the `_locales` directory, organized by language code.

## File Structure

```
Sage-Like/
└── _locales/
    ├── en/
    │   └── messages.json     # English (default language)
    ├── fr/
    │   └── messages.json     # French translation
    ├── de/
    │   └── messages.json     # German translation
    └── [locale-code]/
        └── messages.json     # Additional language
```

## Adding a New Translation

To add support for a new language:

1. **Create the locale folder** under `Sage-Like/_locales/`:
   ```
   Sage-Like/_locales/[locale-code]/
   ```
   Use the appropriate [BCP 47 language tag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation) (e.g., `fr`, `de`, `es`, `pt_BR`, `zh_CN`).

2. **Copy the English messages.json** as a template:
   ```bash
   copy Sage-Like\_locales\en\messages.json Sage-Like\_locales\[locale-code]\messages.json
   ```

3. **Translate all message values** in the new `messages.json` file:
   - Translate only the `"message"` field
   - Keep the `"description"` field in English (it helps translators understand context)
   - Do NOT translate placeholder names (e.g., `$FEED_NAME$`)
   - Preserve special characters and escape sequences (e.g., `\n`, `&apos;`)

4. **Test the translation** by loading the extension with the new locale set in Firefox.

## Message Format

Each entry in `messages.json` follows this structure:

```json
"messageKey": {
  "message": "The actual text to display",
  "description": "Context for translators explaining when/where this text is used"
}
```

For messages with dynamic content (placeholders):

```json
"messageKey": {
  "message": "Hello $USER_NAME$, you have $COUNT$ new items.",
  "description": "Greeting message with user's name and item count",
  "placeholders": {
    "USER_NAME": {
      "content": "$1"
    },
    "COUNT": {
      "content": "$2"
    }
  }
}
```

## Naming Conventions

Message keys follow a consistent naming pattern to indicate their origin and usage:

### Prefix Conventions

- **`htm_`** - Used in HTML files via `data-i18n` attributes
  - Example: `htm_feedPreviewNoFeed` in `feedPreview.html`

- **`js_`** - Used in JavaScript files via `i18n()` function calls
  - Example: `js_commonUtilClipboardReadError` in `common.js`

### Structure Patterns

Keys are organized by module/component:

```
[prefix]_[module][Component][Purpose]
```

Examples:
- `htm_feedPreviewTitle` - HTML title in feedPreview module
- `js_panelRequiredPermissionsCaption` - JS caption in panel module
- `js_propertiesURLInvalid` - JS validation message in properties module

## Using Placeholders

Placeholders allow inserting dynamic values into translated strings.

### In messages.json:

```json
"js_discoveryAlreadyInTree": {
  "message": "Already in tree: '$FEED_NAME$'",
  "description": "Message shown when attempting to add a feed that already exists",
  "placeholders": {
    "FEED_NAME": {
      "content": "$1"
    }
  }
}
```

### In JavaScript:

```javascript
// Single placeholder
let msg = browser.i18n.getMessage("js_discoveryAlreadyInTree", feedName);

// Multiple placeholders
let msg = browser.i18n.getMessage("js_panelNewVersionIncompatibleBrowser", [newVersion, browserVersion]);
```

### Important Notes:

- Placeholder names (e.g., `$FEED_NAME$`) should **NOT** be translated
- The order of placeholders may be rearranged to match the target language's grammar
- Placeholder content indices (`$1`, `$2`, etc.) map to function call parameters

## HTML Internationalization

HTML elements are internationalized using special `data-i18n` attributes:

### Basic Text Content

```html
<span data-i18n="htm_feedPreviewTitle">Feed Preview</span>
```

This replaces the element's `textContent` with the translated message.

### Title Attributes

```html
<button data-i18n-title="htm_feedPreviewRefreshTooltip">Refresh</button>
```

This replaces the element's `title` attribute.

### Initialization

The translation is applied automatically by calling:

```javascript
initializeI18nDocument(document);
```

This is typically done in the page's initialization code.

## JavaScript Internationalization

### Basic Usage

```javascript
// Get a translated message
let message = browser.i18n.getMessage("js_messageKey");

// With single substitution
let message = browser.i18n.getMessage("js_messageKey", substitutionValue);

// With multiple substitutions
let message = browser.i18n.getMessage("js_messageKey", [value1, value2, value3]);
```

### Helper Function

The extension provides a convenience wrapper:

```javascript
function i18n(messageName, substitutions = null) {
  return browser.i18n.getMessage(messageName, substitutions);
}
```

Usage:
```javascript
let msg = i18n("js_commonUtilClipboardReadError");
let msg = i18n("js_discoveryAlreadyInTree", feedName);
```

### Document Initialization

For HTML documents, call this at page load:

```javascript
function initializeI18nDocument(doc) {
  // Translates all elements with data-i18n attributes
  doc.querySelectorAll("[data-i18n]").forEach(elm => {
    elm.textContent = i18n(elm.getAttribute("data-i18n"));
  });

  // Translates all title attributes with data-i18n-title
  doc.querySelectorAll("[data-i18n-title]").forEach(elm => {
    elm.title = i18n(elm.getAttribute("data-i18n-title"));
  });
}
```

## Testing Translations

### Manual Testing

1. **Set Firefox to the target language:**
   - Open `about:config`
   - Set `intl.locale.requested` to your language code (e.g., `fr`, `de`)
   - Restart Firefox

2. **Load the extension** in temporary mode:
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file

3. **Navigate through all extension pages:**
   - Sidebar panel
   - Feed preview
   - Preferences
   - Page popup
   - Context menus

4. **Verify:**
   - All text is translated correctly
   - No English text remains visible
   - Placeholders are replaced with actual values
   - Grammar and sentence structure make sense
   - Special characters display correctly

### Automated Testing

Run the validation script (see [Validation](#validation) section).

## Validation

The extension includes a validation script to ensure i18n integrity:

```bash
node .misc\validate-i18n.js
```

This script checks for:

1. **Missing message keys** - All `data-i18n` and `data-i18n-title` attributes reference existing keys
2. **Missing i18n() calls** - All `i18n()` function calls use valid message keys
3. **Unused messages** - All message keys in `messages.json` are actually used
4. **Empty descriptions** - All messages have helpful description fields
5. **Placeholder consistency** - Placeholder definitions match their usage

Fix any issues reported by the validator before submitting translations.

## Best Practices

### For Translators

1. **Understand context** - Read the `description` field carefully
2. **Preserve formatting** - Keep newlines (`\n`), quotes, and special characters
3. **Test in context** - See how translations appear in the actual UI
4. **Keep placeholder names** - Never translate `$PLACEHOLDER_NAME$` identifiers
5. **Match tone** - Maintain consistent formality/informality with English version
6. **Report issues** - If a message is unclear or seems incorrect, file an issue

### For Developers

1. **Always add descriptions** - Every message must have a clear, helpful description
2. **Use semantic keys** - Follow the naming convention (`htm_` / `js_` prefix + module name)
3. **Extract all strings** - Never hardcode user-facing text in code
4. **Test with long text** - Some languages (German, Finnish) have longer words
5. **Update all locales** - When adding new keys, add them to all locale files
6. **Run validation** - Always run `validate-i18n.js` before committing changes
7. **Document placeholders** - Clearly explain what each placeholder represents

### Common Pitfalls to Avoid

❌ **Don't** hardcode strings in JavaScript:
```javascript
alert("Feed not found"); // BAD
```

✅ **Do** use i18n:
```javascript
alert(i18n("js_errorFeedNotFound")); // GOOD
```

❌ **Don't** concatenate translated strings:
```javascript
let msg = i18n("js_hello") + " " + userName; // BAD - word order varies by language
```

✅ **Do** use placeholders:
```javascript
let msg = i18n("js_helloUser", userName); // GOOD
```

❌ **Don't** translate placeholder names:
```json
{
  "message": "Bonjour $NOM_UTILISATEUR$",  // BAD
  "placeholders": {
    "NOM_UTILISATEUR": { "content": "$1" }
  }
}
```

✅ **Do** keep placeholder names in English:
```json
{
  "message": "Bonjour $USER_NAME$",  // GOOD
  "placeholders": {
    "USER_NAME": { "content": "$1" }
  }
}
```

## Resources

- [Mozilla i18n API Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n)
- [Localization Best Practices](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization)
- [BCP 47 Language Tags](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation)
- [Predefined Messages](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n/Predefined_messages)

## Getting Help

If you have questions about localization:

1. Check this documentation
2. Review the English `messages.json` for examples
3. Look at existing translated locale files
4. File an issue on the project's issue tracker
5. Contact the development team

---

**Thank you for helping make Sage-Like accessible to users worldwide! 🌍**
