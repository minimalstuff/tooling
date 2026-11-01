import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { readJsonDocument } from '#cli/json_file.ts';
import type { PackageManifest, PresetFlags, PresetName } from '#cli/types.ts';

export const ROOT_WORKSPACE_PATH = '.';

const WORKSPACE_DIRECTORIES = ['apps', 'packages'];

const REACT_PACKAGES = [
	'react',
	'react-dom',
	'@types/react',
	'@types/react-dom',
];
const VITEST_PACKAGES = ['vitest'];
const ADONISJS_SCOPE_PREFIX = '@adonisjs/';
const SUBPATH_IMPORT_PREFIX = '#';

type DependencyNames = ReadonlySet<string>;

function collectDependencyNames(
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

export function hasSubpathImports(
	manifests: readonly PackageManifest[]
): boolean {
	return manifests.some(({ imports }) =>
		Object.keys(imports ?? {}).some((key) =>
			key.startsWith(SUBPATH_IMPORT_PREFIX)
		)
	);
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

export interface WorkspaceManifest {
	workspacePath: string;
	manifest: PackageManifest;
}

interface WorkspaceManifestLocation {
	workspacePath: string;
	manifestPath: string;
}

async function listDirectoryManifestLocations(
	cwd: string,
	workspaceDirectory: string
): Promise<WorkspaceManifestLocation[]> {
	const directoryPath = join(cwd, workspaceDirectory);
	if (!existsSync(directoryPath)) return [];

	const entries = await readdir(directoryPath, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isDirectory())
		.map((entry) => ({
			workspacePath: `${workspaceDirectory}/${entry.name}`,
			manifestPath: join(directoryPath, entry.name, 'package.json'),
		}))
		.filter(({ manifestPath }) => existsSync(manifestPath));
}

async function listWorkspaceManifestLocations(
	cwd: string
): Promise<WorkspaceManifestLocation[]> {
	const locationsPerDirectory = await Promise.all(
		WORKSPACE_DIRECTORIES.map((workspaceDirectory) =>
			listDirectoryManifestLocations(cwd, workspaceDirectory)
		)
	);
	return locationsPerDirectory.flat();
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

export function findAdonisjsWorkspacePaths(
	workspaceManifests: readonly WorkspaceManifest[]
): string[] {
	return workspaceManifests
		.filter(({ manifest }) => detectPresetFlags([manifest]).adonisjs)
		.map(({ workspacePath }) => workspacePath);
}

export async function detectPresets(cwd: string): Promise<PresetFlags> {
	const workspaceManifests = await readWorkspaceManifests(cwd);
	return detectPresetFlags(workspaceManifests.map(({ manifest }) => manifest));
}

export async function detectAdonisjsWorkspacePaths(
	cwd: string
): Promise<string[]> {
	return findAdonisjsWorkspacePaths(await readWorkspaceManifests(cwd));
}

export async function detectSubpathImports(cwd: string): Promise<boolean> {
	const workspaceManifests = await readWorkspaceManifests(cwd);
	return hasSubpathImports(workspaceManifests.map(({ manifest }) => manifest));
}
