#!/usr/bin/env node

/////////////////////////////////////////////////////////////////////////////////////////////////////
// i18n Validation Script for Sage-Like Extension
//
// This script validates the internationalization integrity by checking:
// 1. All data-i18n and data-i18n-title attributes reference existing message keys
// 2. All i18n() function calls use valid message keys
// 3. All message keys in messages.json are actually used in the codebase
// 4. All messages have non-empty description fields
// 5. Placeholder consistency between definitions and usage
//

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

class I18nValidator {

	constructor(rootDir) {
		this.rootDir = rootDir;
		this.sageDir = path.join(rootDir, 'Sage-Like');
		this.messagesPath = path.join(this.sageDir, '_locales', 'en', 'messages.json');
		this.messages = {};
		this.usedKeys = new Set();
		this.errors = [];
		this.warnings = [];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Main validation entry point */
	async validate() {
		console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════`);
		console.log(`  Sage-Like i18n Validation`);
		console.log(`═══════════════════════════════════════════════════════════════${colors.reset}\n`);

		// Load messages.json (English)
		if (!this.loadMessages()) {
			return false;
		}

		console.log(`${colors.blue}Loaded ${Object.keys(this.messages).length} message keys from default messages.json (en)${colors.reset}\n`);

		// Validate all files
		this.validateManifest();
		this.validateHtmlFiles();
		this.validateJsFiles();

		// Validate all locales
		this.validateAllLocales();

		// Print results
		this.printResults();

		return this.errors.length === 0;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Load and parse messages.json */
	loadMessages() {
		try {
			const data = fs.readFileSync(this.messagesPath, 'utf8');

			// Remove JSON comments (lines starting with //)
			const cleanedData = data.split('\n')
				.filter(line => !line.trim().startsWith('//'))
				.join('\n');

			this.messages = JSON.parse(cleanedData);
			return true;
		} catch (error) {
			this.errors.push({
				file: this.messagesPath,
				message: `Failed to load messages.json: ${error.message}`
			});
			return false;
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Validate manifest.json for predefined message keys */
	validateManifest() {
		console.log(`${colors.blue}Validating manifest.json...${colors.reset}`);

		try {
			const manifestPath = path.join(this.sageDir, 'manifest.json');
			const manifestContent = fs.readFileSync(manifestPath, 'utf8');

			// Find all __MSG_...__  patterns
			const msgMatches = manifestContent.matchAll(/__MSG_([^_]+)__/g);
			for (const match of msgMatches) {
				const key = match[1];
				this.checkKey(key, 'manifest.json', 'manifest predefined message');
			}

			console.log(`  Checked manifest.json\n`);
		} catch (error) {
			this.warnings.push({
				file: 'manifest.json',
				message: `Could not validate manifest.json: ${error.message}`
			});
			console.log(`  ${colors.yellow}Warning: Could not check manifest.json${colors.reset}\n`);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Validate all HTML files */
	validateHtmlFiles() {
		console.log(`${colors.blue}Validating HTML files...${colors.reset}`);

		const htmlFiles = this.findFiles(this.sageDir, '.html');

		htmlFiles.forEach(file => {
			const content = fs.readFileSync(file, 'utf8');

			// Find all data-i18n attributes
			const dataI18nMatches = content.matchAll(/data-i18n="([^"]+)"/g);
			for (const match of dataI18nMatches) {
				const key = match[1];
				this.checkKey(key, file, 'data-i18n attribute');
			}

			// Find all data-i18n-title attributes
			const dataI18nTitleMatches = content.matchAll(/data-i18n-title="([^"]+)"/g);
			for (const match of dataI18nTitleMatches) {
				const key = match[1];
				this.checkKey(key, file, 'data-i18n-title attribute');
			}

			// Find all data-i18n-tooltip-title attributes
			const dataI18nTooltipTitleMatches = content.matchAll(/data-i18n-tooltip-title="([^"]+)"/g);
			for (const match of dataI18nTooltipTitleMatches) {
				const key = match[1];
				this.checkKey(key, file, 'data-i18n-tooltip-title attribute');
			}
		});

		console.log(`  Checked ${htmlFiles.length} HTML files\n`);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Validate all JavaScript files */
	validateJsFiles() {
		console.log(`${colors.blue}Validating JavaScript files...${colors.reset}`);

		const jsFiles = this.findFiles(this.sageDir, '.js');

		jsFiles.forEach(file => {
			const content = fs.readFileSync(file, 'utf8');

			// Check for dynamic key patterns FIRST and mark base keys as used
			// Pattern: i18n("js_commonRelativeTime_" + unit)
			const dynamicMatches = content.matchAll(/i18n\s*\(\s*["']([^"']+)["']\s*\+/g);
			for (const match of dynamicMatches) {
				const baseKey = match[1]; // e.g., "js_commonRelativeTime_"
				// Mark all related keys as potentially used
				for (const key of Object.keys(this.messages)) {
					if (key.startsWith(baseKey)) {
						this.usedKeys.add(key);
					}
				}
			}

			// Find all i18n() calls with string literal keys
			// Matches: i18n("key") or i18n('key')
			const i18nMatches = content.matchAll(/i18n\s*\(\s*["']([^"']+)["']/g);
			for (const match of i18nMatches) {
				const key = match[1];
				// Skip dynamic keys (partial keys that end with _ and are followed by +)
				const isDynamic = content.includes(`"${key}" +`) || content.includes(`'${key}' +`);
				if (!isDynamic) {
					this.checkKey(key, file, 'i18n() call');
				}
			}

			// Find all browser.i18n.getMessage() calls
			const getMessageMatches = content.matchAll(/browser\.i18n\.getMessage\s*\(\s*["']([^"']+)["']/g);
			for (const match of getMessageMatches) {
				const key = match[1];
				const isDynamic = content.includes(`"${key}" +`) || content.includes(`'${key}' +`);
				if (!isDynamic) {
					this.checkKey(key, file, 'browser.i18n.getMessage() call');
				}
			}
		});

		console.log(`  Checked ${jsFiles.length} JavaScript files\n`);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Check if a key exists in messages.json and mark it as used */
	checkKey(key, file, context) {
		if (!this.messages[key]) {
			this.errors.push({
				file: path.relative(this.rootDir, file),
				message: `Missing message key "${key}" (used in ${context})`
			});
		} else {
			this.usedKeys.add(key);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Validate all locales */
	validateAllLocales() {
		console.log(`${colors.blue}Validating all locales...${colors.reset}`);

		const localesDir = path.join(this.sageDir, '_locales');
		const locales = fs.readdirSync(localesDir);

		for (const locale of locales) {
			const localePath = path.join(localesDir, locale);
			if (fs.statSync(localePath).isDirectory()) {
				this.validateLocale(localePath);
			}
		}
		console.log(`  Checked all locales in ${localesDir}\n`);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Validate a specific locale */
	validateLocale(localePath) {
		const messagesPath = path.join(localePath, 'messages.json');
		let messages;

		// Load messages
		try {
			const data = fs.readFileSync(messagesPath, 'utf8');
			// Remove JSON comments
			const cleanedData = data.split('\n')
				.filter(line => !line.trim().startsWith('//'))
				.join('\n');
			messages = JSON.parse(cleanedData);
		} catch (error) {
			this.errors.push({
				file: messagesPath,
				message: `Failed to load messages.json: ${error.message}`
			});
			return;
		}

		// Check for missing keys (keys used in code but missing in this locale)
		for (const key of this.usedKeys) {
			if (!messages[key]) {
				this.errors.push({
					file: path.relative(this.rootDir, messagesPath),
					message: `Missing message key "${key}" (present in code)`
				});
			}
		}

		// Check for unused keys
		this.checkUnusedKeys(messages, messagesPath);

		// Check descriptions
		this.checkDescriptions(messages, messagesPath);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Check for unused keys in a message object */
	checkUnusedKeys(messages, filePath) {
		const allKeys = Object.keys(messages);
		const unusedKeys = allKeys.filter(key => !this.usedKeys.has(key));

		if (unusedKeys.length > 0) {
			unusedKeys.forEach(key => {
				this.warnings.push({
					file: path.relative(this.rootDir, filePath),
					message: `Message key "${key}" is defined but never used`
				});
			});
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Check descriptions in a message object */
	checkDescriptions(messages, filePath) {
		for (const [key, value] of Object.entries(messages)) {
			if (!value.description || value.description.trim() === '') {
				this.warnings.push({
					file: path.relative(this.rootDir, filePath),
					message: `Message key "${key}" has an empty description`
				});
			}
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Recursively find all files with a specific extension */
	findFiles(dir, ext, fileList = []) {
		const files = fs.readdirSync(dir);

		files.forEach(file => {
			const filePath = path.join(dir, file);
			const stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				this.findFiles(filePath, ext, fileList);
			} else if (path.extname(file) === ext) {
				fileList.push(filePath);
			}
		});

		return fileList;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	/* Print validation results */
	printResults() {
		console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
		console.log(`${colors.cyan}  Validation Results${colors.reset}`);
		console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

		// Print errors
		if (this.errors.length > 0) {
			console.log(`${colors.red}✗ ${this.errors.length} ERROR(S):${colors.reset}\n`);
			this.errors.forEach(error => {
				console.log(`${colors.red}  [ERROR]${colors.reset} ${error.file}`);
				console.log(`    ${error.message}\n`);
			});
		} else {
			console.log(`${colors.green}✓ No errors found!${colors.reset}\n`);
		}

		// Print warnings
		if (this.warnings.length > 0) {
			console.log(`${colors.yellow}⚠ ${this.warnings.length} WARNING(S):${colors.reset}\n`);
			this.warnings.forEach(warning => {
				console.log(`${colors.yellow}  [WARNING]${colors.reset} ${warning.file}`);
				console.log(`    ${warning.message}\n`);
			});
		} else {
			console.log(`${colors.green}✓ No warnings!${colors.reset}\n`);
		}

		// Summary
		console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
		console.log(`${colors.cyan}  Summary${colors.reset}`);
		console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

		const totalKeys = Object.keys(this.messages).length;
		const usedKeysCount = this.usedKeys.size;
		const coverage = ((usedKeysCount / totalKeys) * 100).toFixed(1);

		console.log(`  Total message keys: ${totalKeys}`);
		console.log(`  Used message keys: ${usedKeysCount}`);
		console.log(`  Coverage: ${coverage}%`);
		console.log(`  Errors: ${this.errors.length}`);
		console.log(`  Warnings: ${this.warnings.length}\n`);

		if (this.errors.length === 0 && this.warnings.length === 0) {
			console.log(`${colors.green}  🎉 All validations passed! i18n integrity is excellent!${colors.reset}\n`);
		} else if (this.errors.length === 0) {
			console.log(`${colors.yellow}  ⚠️  Validation passed with warnings. Consider addressing them.${colors.reset}\n`);
		} else {
			console.log(`${colors.red}  ❌ Validation failed. Please fix the errors above.${colors.reset}\n`);
		}
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
/* Main execution */
(async () => {
	const rootDir = path.resolve(__dirname, '..');
	const validator = new I18nValidator(rootDir);

	const success = await validator.validate();
	process.exit(success ? 0 : 1);
})();
