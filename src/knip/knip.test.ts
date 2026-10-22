import { afterEach, describe, expect, it } from 'vitest';

import { createFixture, runBinary, type Fixture } from '../oxc/test_utils.ts';
import { ADONISJS_WORKSPACE_CONFIG } from './adonisjs_workspace.ts';
import { minimalstuffPreset } from './knip.ts';

const WEBAPP_PATH = 'apps/webapp';
const KNIP_CONFIG_FILE = 'knip.json';
const UNUSED_FILE = 'app/orphan.ts';
const ADONISJS_CONVENTION_FILES = [
	'adonisrc.ts',
	'start/routes.ts',
	'config/app.ts',
	'database/schema.ts',
];

const ADONISJS_FIXTURE_FILES: Record<string, string> = {
	'package.json': JSON.stringify({ name: 'fixture', type: 'module' }),
	'adonisrc.ts': 'export default { providers: [] };\n',
	'start/routes.ts': 'export const routes = [];\n',
	'config/app.ts': 'export default { appKey: "key" };\n',
	'database/schema.ts': 'export const schema = {};\n',
	[UNUSED_FILE]: 'export const orphan = 1;\n',
};

describe('minimalstuffPreset (knip) config', () => {
	it('should return an empty config when no option is given', () => {
		expect(minimalstuffPreset()).toEqual({});
	});

	it('should return the user config untouched when adonisjs is disabled', () => {
		const config = minimalstuffPreset({ adonisjs: false, entry: ['src/a.ts'] });

		expect(config).toEqual({ entry: ['src/a.ts'] });
	});

	it('should apply the adonisjs config to the root workspace when adonisjs is true', () => {
		const config = minimalstuffPreset({ adonisjs: true });

		expect(config).toEqual(ADONISJS_WORKSPACE_CONFIG);
		expect(config.workspaces).toBeUndefined();
	});

	it('should concatenate the user arrays after the preset arrays when adonisjs is true', () => {
		const config = minimalstuffPreset({
			adonisjs: true,
			entry: ['src/extra.ts'],
			ignoreDependencies: ['left-pad'],
		});

		expect(config.entry).toEqual([
			...(ADONISJS_WORKSPACE_CONFIG.entry as string[]),
			'src/extra.ts',
		]);
		expect(config.ignoreDependencies).toEqual([
			...(ADONISJS_WORKSPACE_CONFIG.ignoreDependencies as string[]),
			'left-pad',
		]);
	});

	it('should accept a single string entry from the user when adonisjs is true', () => {
		const config = minimalstuffPreset({ adonisjs: true, entry: 'src/one.ts' });

		expect(config.entry).toEqual([
			...(ADONISJS_WORKSPACE_CONFIG.entry as string[]),
			'src/one.ts',
		]);
	});

	it('should let user scalar keys win over the preset', () => {
		const config = minimalstuffPreset({
			adonisjs: true,
			ignoreExportsUsedInFile: true,
		});

		expect(config.ignoreExportsUsedInFile).toBe(true);
	});

	it('should apply the adonisjs config to each listed workspace when adonisjs is an array', () => {
		const config = minimalstuffPreset({ adonisjs: [WEBAPP_PATH, 'apps/api'] });

		expect(config.workspaces).toEqual({
			[WEBAPP_PATH]: ADONISJS_WORKSPACE_CONFIG,
			'apps/api': ADONISJS_WORKSPACE_CONFIG,
		});
		expect(config.entry).toBeUndefined();
	});

	it('should merge the user workspace config with the preset when the workspace is listed', () => {
		const config = minimalstuffPreset({
			adonisjs: [WEBAPP_PATH],
			workspaces: {
				[WEBAPP_PATH]: { entry: ['src/extra.ts'] },
				'apps/extension': { entry: ['entrypoints/*.ts'] },
			},
		});

		expect(config.workspaces?.[WEBAPP_PATH]?.entry).toEqual([
			...(ADONISJS_WORKSPACE_CONFIG.entry as string[]),
			'src/extra.ts',
		]);
		expect(config.workspaces?.['apps/extension']).toEqual({
			entry: ['entrypoints/*.ts'],
		});
	});

	it('should keep the root user keys when adonisjs is an array', () => {
		const config = minimalstuffPreset({
			adonisjs: [WEBAPP_PATH],
			ignore: ['docs/**'],
		});

		expect(config.ignore).toEqual(['docs/**']);
	});

	it('should not mutate the preset config when merging user arrays', () => {
		const entryCountBefore = ADONISJS_WORKSPACE_CONFIG.entry?.length;

		minimalstuffPreset({ adonisjs: true, entry: ['src/extra.ts'] });

		expect(ADONISJS_WORKSPACE_CONFIG.entry).toHaveLength(entryCountBefore ?? 0);
	});
});

describe('minimalstuffPreset (knip) real run', () => {
	let fixture: Fixture | undefined;

	afterEach(async () => {
		await fixture?.remove();
		fixture = undefined;
	});

	async function runKnipOnAdonisjsFixture(
		adonisjs: boolean
	): Promise<{ exitCode: number; output: string }> {
		fixture = await createFixture({
			...ADONISJS_FIXTURE_FILES,
			[KNIP_CONFIG_FILE]: JSON.stringify(minimalstuffPreset({ adonisjs })),
		});
		return runBinary('knip', fixture.directory, [
			'--no-progress',
			'--reporter',
			'compact',
		]);
	}

	it('should only report the truly unused file when adonisjs is true', async () => {
		const outcome = await runKnipOnAdonisjsFixture(true);

		expect(outcome.exitCode).not.toBe(0);
		expect(outcome.output).toContain(UNUSED_FILE);
		for (const conventionFile of ADONISJS_CONVENTION_FILES) {
			expect(outcome.output).not.toContain(conventionFile);
		}
	});

	it('should report the adonisjs convention files when adonisjs is false', async () => {
		const outcome = await runKnipOnAdonisjsFixture(false);

		for (const conventionFile of ADONISJS_CONVENTION_FILES) {
			expect(outcome.output).toContain(conventionFile);
		}
	});
});
