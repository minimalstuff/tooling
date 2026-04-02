import { defineConfig } from 'oxfmt';

import { IGNORE_PATTERNS } from './shared.ts';

type OxfmtOptions = Partial<Parameters<typeof defineConfig>[0]>;

export function minimalstuffPreset(
	config: OxfmtOptions = {}
): ReturnType<typeof defineConfig> {
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
		ignorePatterns: IGNORE_PATTERNS,
		htmlWhitespaceSensitivity: 'ignore',
		...config,
	});
}
