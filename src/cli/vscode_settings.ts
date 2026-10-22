import { log } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
	DEFAULT_INDENTATION,
	detectIndentation,
	type JsonObject,
	parseJsonObject,
	stringifyJson,
} from './json_file.ts';

const VSCODE_SETTINGS: Readonly<JsonObject> = {
	'oxc.typeAware': true,
	'editor.defaultFormatter': 'oxc.oxc-vscode',
};

export function mergeVscodeSettings(
	existingSettings: Readonly<JsonObject>,
	settingsToAdd: Readonly<JsonObject> = VSCODE_SETTINGS
): JsonObject {
	const merged: JsonObject = { ...existingSettings };
	for (const [key, value] of Object.entries(settingsToAdd)) {
		if (!(key in merged)) merged[key] = value;
	}
	return merged;
}

export async function updateVscodeSettings(cwd: string): Promise<void> {
	const vscodeDirectory = join(cwd, '.vscode');
	const settingsPath = join(vscodeDirectory, 'settings.json');
	await mkdir(vscodeDirectory, { recursive: true });

	const raw = existsSync(settingsPath)
		? await readFile(settingsPath, 'utf-8')
		: '';
	const indentation = raw ? detectIndentation(raw) : DEFAULT_INDENTATION;
	const settings = mergeVscodeSettings(parseJsonObject(raw, settingsPath));

	await writeFile(settingsPath, stringifyJson(settings, indentation), 'utf-8');
	log.success('.vscode/settings.json updated');
}
