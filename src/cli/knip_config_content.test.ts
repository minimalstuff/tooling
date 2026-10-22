import { describe, expect, it } from 'vitest';

import {
	buildKnipConfigContent,
	toKnipAdonisjsOption,
} from './knip_config_content.ts';

const LONG_WORKSPACE_PATHS = [
	'apps/customer-facing-webapp',
	'packages/internal-backend-api',
	'packages/background-workers',
];

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
			'minimalstuffPreset({\n\tadonisjs: true,\n});'
		);
	});

	it('should list the quoted workspace paths on one line when they fit the print width', () => {
		expect(buildKnipConfigContent(['apps/webapp', 'packages/api'])).toContain(
			"minimalstuffPreset({\n\tadonisjs: ['apps/webapp', 'packages/api'],\n});"
		);
	});

	it('should list one quoted workspace path per line when they exceed the print width', () => {
		expect(buildKnipConfigContent(LONG_WORKSPACE_PATHS)).toContain(
			"minimalstuffPreset({\n\tadonisjs: [\n\t\t'apps/customer-facing-webapp',\n\t\t'packages/internal-backend-api',\n\t\t'packages/background-workers',\n\t],\n});"
		);
	});
});
