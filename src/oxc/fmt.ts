import { type OxfmtConfig, defineConfig } from 'oxfmt';

import {
	ADONISJS_IGNORE_PATTERNS,
	COMMON_IGNORE_PATTERNS,
	FORMAT_ONLY_IGNORE_PATTERNS,
} from './shared.ts';

const INTERNAL_IMPORT_PREFIXES = ['@/', '~/'];

export interface MinimalstuffOxfmtOptions extends OxfmtConfig {
	/** Add AdonisJS ignore patterns. */
	adonisjs?: boolean;
}

/**
 * Builds the root oxfmt config. Options override the defaults, except
 * `ignorePatterns` which are appended to the preset ones.
 */
export function minimalstuffPreset(
	options: MinimalstuffOxfmtOptions = {}
): OxfmtConfig {
	const {
		adonisjs = false,
		ignorePatterns: userIgnorePatterns = [],
		...userConfig
	} = options;

	return defineConfig({
		printWidth: 80,
		tabWidth: 2,
		useTabs: true,
		semi: true,
		singleQuote: true,
		quoteProps: 'as-needed',
		bracketSpacing: true,
		arrowParens: 'always',
		trailingComma: 'es5',
		htmlWhitespaceSensitivity: 'ignore',
		sortImports: {
			internalPattern: INTERNAL_IMPORT_PREFIXES,
			groups: [
				['side_effect', 'side_effect_style'],
				['builtin', 'external'],
				[
					'internal',
					'subpath',
					'parent',
					'sibling',
					'index',
					'style',
					'unknown',
				],
			],
		},
		...userConfig,
		ignorePatterns: [
			...COMMON_IGNORE_PATTERNS,
			...FORMAT_ONLY_IGNORE_PATTERNS,
			...(adonisjs ? ADONISJS_IGNORE_PATTERNS : []),
			...userIgnorePatterns,
		],
	});
}
