import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { readJsonDocument } from './json_file.ts';
import type { PackageManifest, PresetFlags, PresetName } from './types.ts';

const ROOT_WORKSPACE_PATH = '.';

const WORKSPACE_DIRECTORIES = ['apps', 'packages'];

const REACT_PACKAGES = [
	'react',
	'react-dom',
	'@types/react',
	'@types/react-dom',
];
const VITEST_PACKAGES = ['vitest'];
const ADONISJS_SCOPE_PREFIX = '@adonisjs/';

type DependencyNames = ReadonlySet<string>;

export function collectDependencyNames(
	manifests: readonly PackageManifest[]
): DependencyNames {
	const names = new Set<string>();
	for (const manifest of manifests) {
		for (const dependencies of [
			manifest.dependencies,
			manifest.devDependencies,
			manifest.peerDependencies,
		]) {
			for (const name of Object.keys(dependencies ?? {})) names.add(name);
		}
	}
	return names;
}

export function detectPresetFlags(
	manifests: readonly PackageManifest[]
): PresetFlags {
	const names = collectDependencyNames(manifests);
	const hasAnyOf = (candidates: readonly string[]): boolean =>
		candidates.some((candidate) => names.has(candidate));

	return {
		react: hasAnyOf(REACT_PACKAGES),
		vitest: hasAnyOf(VITEST_PACKAGES),
		adonisjs: [...names].some((name) => name.startsWith(ADONISJS_SCOPE_PREFIX)),
	};
}

export function toDetectedPresetNames(flags: PresetFlags): PresetName[] {
	return (Object.keys(flags) as PresetName[]).filter((name) => flags[name]);
}

export function toPresetFlags(names: readonly PresetName[]): PresetFlags {
	return {
		react: names.includes('react'),
		adonisjs: names.includes('adonisjs'),
		vitest: names.includes('vitest'),
	};
}

interface WorkspaceManifest {
	workspacePath: string;
	manifest: PackageManifest;
}

interface WorkspaceManifestLocation {
	workspacePath: string;
	manifestPath: string;
}

async function listWorkspaceManifestLocations(
	cwd: string
): Promise<WorkspaceManifestLocation[]> {
	const locations: WorkspaceManifestLocation[] = [];
	for (const workspaceDirectory of WORKSPACE_DIRECTORIES) {
		const directoryPath = join(cwd, workspaceDirectory);
		if (!existsSync(directoryPath)) continue;

		const entries = await readdir(directoryPath, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const manifestPath = join(directoryPath, entry.name, 'package.json');
			if (!existsSync(manifestPath)) continue;
			locations.push({
				workspacePath: `${workspaceDirectory}/${entry.name}`,
				manifestPath,
			});
		}
	}
	return locations;
}

async function readWorkspaceManifests(
	cwd: string
): Promise<WorkspaceManifest[]> {
	const rootManifestPath = join(cwd, 'package.json');
	if (!existsSync(rootManifestPath)) {
		throw new Error(`No package.json found in ${cwd}`);
	}

	const locations: WorkspaceManifestLocation[] = [
		{ workspacePath: ROOT_WORKSPACE_PATH, manifestPath: rootManifestPath },
		...(await listWorkspaceManifestLocations(cwd)),
	];
	return Promise.all(
		locations.map(async ({ workspacePath, manifestPath }) => ({
			workspacePath,
			manifest: (await readJsonDocument(manifestPath)).content,
		}))
	);
}

export async function detectPresets(cwd: string): Promise<PresetFlags> {
	const workspaceManifests = await readWorkspaceManifests(cwd);
	return detectPresetFlags(workspaceManifests.map(({ manifest }) => manifest));
}
