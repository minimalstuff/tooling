import { describe, expect, it } from 'vitest';

import { listDevPackages } from '#cli/list_dev_packages.ts';
import type { ConfigTool, PromptResult } from '#cli/types.ts';

const NO_PRESETS = {
	react: false,
	adonisjs: false,
	vitest: false,
	lingui: false,
};

function buildResult(tools: ConfigTool[]): PromptResult {
	return { tools, presetFlags: NO_PRESETS };
}

describe('listDevPackages', () => {
	it('should list the tooling package once when oxc and knip are both selected', () => {
		const packages = listDevPackages(buildResult(['oxc', 'knip']));

		expect(
			packages.filter((name) => name === '@minimalstuff/tooling')
		).toHaveLength(1);
		expect(packages).toEqual(
			expect.arrayContaining(['oxlint', 'oxfmt', 'knip'])
		);
	});

	it('should list only the oxc packages when only oxc is selected', () => {
		const packages = listDevPackages(buildResult(['oxc']));

		expect(packages).toContain('oxlint');
		expect(packages).not.toContain('knip');
	});

	it('should list only the knip packages when only knip is selected', () => {
		const packages = listDevPackages(buildResult(['knip']));

		expect(packages).toEqual(['knip', '@minimalstuff/tooling']);
	});

	it('should return an empty list when only editorconfig and vscode are selected', () => {
		const packages = listDevPackages(buildResult(['editorconfig', 'vscode']));

		expect(packages).toEqual([]);
	});
});
