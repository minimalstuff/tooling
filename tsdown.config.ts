import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: [
		'./src/cli/index.ts',
		'./src/oxc/lint.ts',
		'./src/oxc/fmt.ts',
		'./src/knip/knip.ts',
	],
	dts: true,
	shims: true,
	clean: true,
	format: ['esm'],
	deps: {
		neverBundle: ['knip', 'oxfmt', 'oxlint'],
	},
	target: false,
});
