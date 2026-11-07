import { resolve } from 'node:path';

import { MINIMALSTUFF_SCOPE_PREFIX } from '#check_release/constants.ts';
import { extractPackageName } from '#check_release/extract_package_name.ts';
import { isRecord } from '#check_release/is_record.ts';
import { isUnpublishedOverride } from '#check_release/is_unpublished_override.ts';
import { isUnpublishedSpecifier } from '#check_release/is_unpublished_specifier.ts';
import {
	RELEASE_FINDING_KIND,
	type ReleaseFinding,
} from '#check_release/release_finding.ts';

const DEPENDENCY_FIELDS = [
	'dependencies',
	'devDependencies',
	'optionalDependencies',
] as const;

const PATCH_HINT =
	'upstream the change, release the lib, bump it, then remove the patch';
const LOCAL_HINT = 'release the lib and depend on a published version';

function isMinimalstuffPackage(packageName: string): boolean {
	return packageName.startsWith(MINIMALSTUFF_SCOPE_PREFIX);
}

function findPatchFindings(
	document: Record<string, unknown>
): ReleaseFinding[] {
	const patchedDependencies = document['patchedDependencies'];
	if (!isRecord(patchedDependencies)) return [];

	return Object.keys(patchedDependencies)
		.map(extractPackageName)
		.filter(isMinimalstuffPackage)
		.map((packageName) => ({
			kind: RELEASE_FINDING_KIND.patch,
			packageName,
			location: 'patchedDependencies',
			hint: PATCH_HINT,
		}));
}

function findOverrideFindings(
	document: Record<string, unknown>,
	repositoryRoot: string
): ReleaseFinding[] {
	const overrides = document['overrides'];
	if (!isRecord(overrides)) return [];

	return Object.entries(overrides)
		.filter(([key, value]) => {
			if (!isMinimalstuffPackage(extractPackageName(key))) return false;
			if (typeof value !== 'string') return false;
			return isUnpublishedOverride(value, repositoryRoot);
		})
		.map(([key]) => ({
			kind: RELEASE_FINDING_KIND.override,
			packageName: extractPackageName(key),
			location: 'overrides',
			hint: LOCAL_HINT,
		}));
}

function readInstalledVersion(entry: unknown): string | undefined {
	if (!isRecord(entry)) return undefined;
	const version = entry['version'];
	return typeof version === 'string' ? version : undefined;
}

function findImporterFindings(
	importerPath: string,
	importer: unknown,
	repositoryRoot: string
): ReleaseFinding[] {
	if (!isRecord(importer)) return [];
	const importerDirectory = resolve(repositoryRoot, importerPath);

	return DEPENDENCY_FIELDS.flatMap((field) => {
		const dependencies = importer[field];
		if (!isRecord(dependencies)) return [];

		return Object.entries(dependencies)
			.filter(([packageName, entry]) => {
				if (!isMinimalstuffPackage(packageName)) return false;
				const version = readInstalledVersion(entry);
				if (version === undefined) return false;
				return isUnpublishedSpecifier(
					version,
					repositoryRoot,
					importerDirectory
				);
			})
			.map(([packageName]) => ({
				kind: RELEASE_FINDING_KIND.localDependency,
				packageName,
				location: `importer "${importerPath}" (${field})`,
				hint: LOCAL_HINT,
			}));
	});
}

function findLocalDependencyFindings(
	document: Record<string, unknown>,
	repositoryRoot: string
): ReleaseFinding[] {
	const importers = document['importers'];
	if (!isRecord(importers)) return [];

	return Object.entries(importers).flatMap(([importerPath, importer]) =>
		findImporterFindings(importerPath, importer, repositoryRoot)
	);
}

export function findReleaseFindings(
	documents: readonly unknown[],
	repositoryRoot: string
): ReleaseFinding[] {
	return documents
		.filter(isRecord)
		.flatMap((document) => [
			...findPatchFindings(document),
			...findLocalDependencyFindings(document, repositoryRoot),
			...findOverrideFindings(document, repositoryRoot),
		]);
}
