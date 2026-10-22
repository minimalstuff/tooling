import { describe, expect, it } from 'vitest';

import {
	buildKnipConfigContent,
	toKnipAdonisjsOption,
} from './knip_config_content.ts';

describe('toKnipAdonisjsOption', () => {
	it('should return true when the root workspace uses adonisjs', () => {
		expect(toKnipAdonisjsOption(['.'])).toBe(true);
	});

	it('should return the workspace paths when only workspaces use adonisjs', () => {
		expect(toKnipAdonisjsOption(['apps/webapp', 'packages/api'])).toEqual([
			'apps/webapp',
			'packages/api',
		]);
	});

	it('should return undefined when adonisjs is not used anywhere', () => {
		expect(toKnipAdonisjsOption([])).toBeUndefined();
	});

	it('should return true when both the root and a workspace use adonisjs', () => {
		expect(toKnipAdonisjsOption(['apps/webapp', '.'])).toBe(true);
	});
});

describe('buildKnipConfigContent', () => {
	it('should call the preset without options when adonisjs is undefined', () => {
		expect(buildKnipConfigContent(undefined)).toBe(
			"import { minimalstuffPreset } from '@minimalstuff/tooling/knip';\n\nexport default minimalstuffPreset();\n"
		);
	});

	it('should enable adonisjs on the root when the option is true', () => {
		expect(buildKnipConfigContent(true)).toContain(
			'minimalstuffPreset({ adonisjs: true });'
		);
	});

	it('should list the quoted workspace paths when the option is an array', () => {
		expect(buildKnipConfigContent(['apps/webapp', 'packages/api'])).toContain(
			"minimalstuffPreset({ adonisjs: ['apps/webapp', 'packages/api'] });"
		);
	});
});
