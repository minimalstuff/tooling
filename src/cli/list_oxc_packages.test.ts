import { describe, expect, it } from 'vitest';

import { listOxcPackages } from './list_oxc_packages.ts';

const NO_PRESETS = { react: false, adonisjs: false, vitest: false };

describe('listOxcPackages', () => {
	it('should include the adonisjs eslint plugin when adonisjs is enabled', () => {
		const packages = listOxcPackages({ ...NO_PRESETS, adonisjs: true });

		expect(packages).toContain('@adonisjs/eslint-plugin');
	});

	it('should not include the adonisjs eslint plugin when adonisjs is disabled', () => {
		const packages = listOxcPackages({ ...NO_PRESETS, react: true });

		expect(packages).not.toContain('@adonisjs/eslint-plugin');
	});

	it('should always include the oxc tools and the tooling package', () => {
		const packages = listOxcPackages(NO_PRESETS);

		expect(packages).toEqual(
			expect.arrayContaining([
				'oxfmt',
				'oxlint',
				'oxlint-tsgolint',
				'@minimalstuff/tooling',
			])
		);
	});
});
