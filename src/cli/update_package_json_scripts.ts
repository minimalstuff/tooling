import { join } from 'node:path';

import { readJsonDocument, writeJsonDocument } from './json_file.ts';
import { mergeScripts, type ScriptsMerge } from './package_scripts.ts';
import type { PackageManifest } from './types.ts';

export async function addMissingScripts(
	cwd: string,
	scriptsToAdd: Readonly<Record<string, string>>
): Promise<ScriptsMerge> {
	const manifestPath = join(cwd, 'package.json');
	const document = await readJsonDocument(manifestPath);
	const manifest: PackageManifest = document.content;

	const merge = mergeScripts(manifest.scripts, scriptsToAdd);
	if (merge.addedNames.length === 0) return merge;

	await writeJsonDocument(manifestPath, {
		...document,
		content: { ...manifest, scripts: merge.scripts },
	});
	return merge;
}
