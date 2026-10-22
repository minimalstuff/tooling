import { describe, expect, it } from 'vitest';

import { buildScripts, mergeScripts } from './package_scripts.ts';

const OXC_SCRIPTS = buildScripts(['oxc']);

describe('mergeScripts', () => {
	it('should add every script when none exist', () => {
		const merge = mergeScripts(undefined, OXC_SCRIPTS);

		expect(merge.scripts).toEqual(OXC_SCRIPTS);
		expect(merge.addedNames).toEqual(Object.keys(OXC_SCRIPTS));
		expect(merge.skippedNames).toEqual([]);
	});

	it('should keep existing scripts and report them as skipped when names collide', () => {
		const merge = mergeScripts(
			{ lint: 'eslint .', build: 'tsc' },
			{ lint: 'oxlint', typecheck: 'tsc --noEmit' }
		);

		expect(merge.scripts).toEqual({
			lint: 'eslint .',
			build: 'tsc',
			typecheck: 'tsc --noEmit',
		});
		expect(merge.addedNames).toEqual(['typecheck']);
		expect(merge.skippedNames).toEqual(['lint']);
	});

	it('should not mutate the existing scripts', () => {
		const existing = { lint: 'eslint .' };
		mergeScripts(existing, OXC_SCRIPTS);
		expect(existing).toEqual({ lint: 'eslint .' });
	});
});

describe('buildScripts', () => {
	it('should return no script when oxc is not selected', () => {
		expect(buildScripts(['editorconfig', 'vscode'])).toEqual({});
	});

	it('should return the oxc scripts and a check script when oxc is selected', () => {
		expect(buildScripts(['oxc'])).toEqual({
			lint: 'oxlint',
			'lint:fix': 'oxlint --fix',
			format: 'oxfmt && oxlint --fix',
			'format:check': 'oxfmt --check',
			typecheck: 'tsc --noEmit',
			check: 'pnpm lint && pnpm format:check && pnpm typecheck',
		});
	});
});
