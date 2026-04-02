import {defineConfig} from 'oxfmt'

import {IGNORE_PATTERNS} from './shared.js'

type OxfmtOptions = Partial<Parameters<typeof defineConfig>[0]>

export function minimalstuffPreset(
	config: OxfmtOptions = {},
): ReturnType<typeof defineConfig> {
	return defineConfig({
		printWidth: 80,
		trailingComma: 'all',
		semi: false,
		useTabs: true,
		tabWidth: 2,
		singleQuote: true,
		quoteProps: 'consistent',
		bracketSpacing: false,
		arrowParens: 'avoid',
		ignorePatterns: IGNORE_PATTERNS,
		htmlWhitespaceSensitivity: 'ignore',
		...config,
	})
}

export const julrPreset = minimalstuffPreset
