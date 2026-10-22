import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
	detectAdonisjsWorkspacePaths,
	detectPresetFlags,
	findAdonisjsWorkspacePaths,
	detectPresets,
	toDetectedPresetNames,
	toPresetFlags,
} from './detect_presets.ts';

describe('detectPresetFlags', () => {
	it('should detect nothing when there are no dependencies', () => {
		expect(detectPresetFlags([{}])).toEqual({
			react: false,
			adonisjs: false,
			vitest: false,
		});
	});

	it.each(['react', 'react-dom', '@types/react', '@types/react-dom'])(
		'should detect react when %s is a dependency',
		(name) => {
			expect(detectPresetFlags([{ dependencies: { [name]: '1' } }]).react).toBe(
				true
			);
		}
	);

	it('should detect adonisjs when any @adonisjs package is a dev dependency', () => {
		const flags = detectPresetFlags([
			{ devDependencies: { '@adonisjs/core': '1' } },
		]);
		expect(flags.adonisjs).toBe(true);
	});

	it('should detect vitest when it is a peer dependency', () => {
		const flags = detectPresetFlags([{ peerDependencies: { vitest: '1' } }]);
		expect(flags.vitest).toBe(true);
	});

	it('should merge detections across several manifests', () => {
		const flags = detectPresetFlags([
			{ dependencies: { react: '1' } },
			{ devDependencies: { vitest: '1' } },
		]);
		expect(flags).toEqual({ react: true, adonisjs: false, vitest: true });
	});
});

describe('preset conversions', () => {
	it('should list only the enabled preset names', () => {
		expect(
			toDetectedPresetNames({ react: true, adonisjs: false, vitest: true })
		).toEqual(['react', 'vitest']);
	});

	it('should build flags from selected names', () => {
		expect(toPresetFlags(['adonisjs'])).toEqual({
			react: false,
			adonisjs: true,
			vitest: false,
		});
	});
});

describe('detectPresets', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'detect-presets-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	async function writeManifest(
		relativeDirectory: string,
		manifest: object
	): Promise<void> {
		const manifestDirectory = join(directory, relativeDirectory);
		await mkdir(manifestDirectory, { recursive: true });
		await writeFile(
			join(manifestDirectory, 'package.json'),
			JSON.stringify(manifest)
		);
	}

	it('should detect presets across the root, apps and packages manifests', async () => {
		await writeManifest('.', { devDependencies: { vitest: '1' } });
		await writeManifest('apps/web', { dependencies: { react: '1' } });
		await writeManifest('packages/api', {
			dependencies: { '@adonisjs/core': '1' },
		});

		expect(await detectPresets(directory)).toEqual({
			react: true,
			adonisjs: true,
			vitest: true,
		});
	});

	it('should work when apps and packages directories do not exist', async () => {
		await writeManifest('.', { dependencies: { react: '1' } });

		expect((await detectPresets(directory)).react).toBe(true);
	});

	it('should ignore workspace directories without a package.json', async () => {
		await writeManifest('.', {});
		await mkdir(join(directory, 'apps/empty'), { recursive: true });

		expect(await detectPresets(directory)).toEqual({
			react: false,
			adonisjs: false,
			vitest: false,
		});
	});

	it('should fail with a clear message when the root package.json is missing', async () => {
		await expect(detectPresets(directory)).rejects.toThrow(/No package\.json/);
	});

	it('should fail naming the file when a workspace package.json is invalid', async () => {
		await writeManifest('.', {});
		await mkdir(join(directory, 'apps/web'), { recursive: true });
		await writeFile(join(directory, 'apps/web/package.json'), '{ nope');

		await expect(detectPresets(directory)).rejects.toThrow(
			/apps\/web\/package\.json/
		);
	});
});

describe('findAdonisjsWorkspacePaths', () => {
	it('should return the root path when the root manifest has an @adonisjs dependency', () => {
		expect(
			findAdonisjsWorkspacePaths([
				{
					workspacePath: '.',
					manifest: { dependencies: { '@adonisjs/core': '1' } },
				},
			])
		).toEqual(['.']);
	});

	it('should return only the workspaces whose manifest has an @adonisjs dependency', () => {
		expect(
			findAdonisjsWorkspacePaths([
				{ workspacePath: '.', manifest: { devDependencies: { vitest: '1' } } },
				{
					workspacePath: 'apps/webapp',
					manifest: { dependencies: { '@adonisjs/core': '1' } },
				},
				{ workspacePath: 'apps/extension', manifest: {} },
			])
		).toEqual(['apps/webapp']);
	});

	it('should return nothing when no manifest has an @adonisjs dependency', () => {
		expect(
			findAdonisjsWorkspacePaths([
				{ workspacePath: '.', manifest: { dependencies: { react: '1' } } },
			])
		).toEqual([]);
	});
});

describe('detectAdonisjsWorkspacePaths', () => {
	let directory: string;

	beforeEach(async () => {
		directory = await mkdtemp(join(tmpdir(), 'detect-adonisjs-'));
	});

	afterEach(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	async function writeManifest(
		relativeDirectory: string,
		manifest: object
	): Promise<void> {
		const manifestDirectory = join(directory, relativeDirectory);
		await mkdir(manifestDirectory, { recursive: true });
		await writeFile(
			join(manifestDirectory, 'package.json'),
			JSON.stringify(manifest)
		);
	}

	it('should return the workspace paths with forward slashes when adonisjs lives in apps and packages', async () => {
		await writeManifest('.', {});
		await writeManifest('apps/webapp', {
			dependencies: { '@adonisjs/core': '1' },
		});
		await writeManifest('packages/api', {
			devDependencies: { '@adonisjs/lucid': '1' },
		});
		await writeManifest('packages/ui', { dependencies: { react: '1' } });

		expect((await detectAdonisjsWorkspacePaths(directory)).sort()).toEqual([
			'apps/webapp',
			'packages/api',
		]);
	});

	it('should return the root path when adonisjs is a root dependency', async () => {
		await writeManifest('.', { dependencies: { '@adonisjs/core': '1' } });

		expect(await detectAdonisjsWorkspacePaths(directory)).toEqual(['.']);
	});
});
