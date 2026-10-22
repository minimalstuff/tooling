import { installPackage } from '@antfu/install-pkg';
import { log } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
	KNIP_CONFIG_FILE_NAME,
	KNIP_CONFIG_FILE_NAMES,
	TOOLING_PACKAGE_NAME,
} from '../constants.ts';
import { detectAdonisjsWorkspacePaths } from './detect_presets.ts';
import {
	buildKnipConfigContent,
	type KnipAdonisjsOption,
	toKnipAdonisjsOption,
} from './knip_config_content.ts';
import type { PromptResult } from './types.ts';
import { writeGeneratedFile } from './write_generated_file.ts';

const KNIP_PACKAGES = ['knip', TOOLING_PACKAGE_NAME];

function warnAboutConflictingConfigs(cwd: string): void {
	const conflictingFileNames = KNIP_CONFIG_FILE_NAMES.filter(
		(fileName) =>
			fileName !== KNIP_CONFIG_FILE_NAME && existsSync(join(cwd, fileName))
	);

	for (const fileName of conflictingFileNames) {
		log.warn(
			`${fileName} found: it will conflict with the generated ${KNIP_CONFIG_FILE_NAME}. Consider removing it.`
		);
	}
}

async function detectAdonisjsOption(
	cwd: string,
	result: PromptResult
): Promise<KnipAdonisjsOption | undefined> {
	if (!result.presetFlags.adonisjs) return undefined;

	return toKnipAdonisjsOption(await detectAdonisjsWorkspacePaths(cwd));
}

export async function updateKnip(result: PromptResult): Promise<void> {
	if (!result.tools.includes('knip')) return;

	const cwd = process.cwd();
	const adonisjsOption = await detectAdonisjsOption(cwd, result);

	warnAboutConflictingConfigs(cwd);
	await writeGeneratedFile(
		join(cwd, KNIP_CONFIG_FILE_NAME),
		buildKnipConfigContent(adonisjsOption)
	);
	await installPackage(KNIP_PACKAGES, { dev: true, cwd });

	log.success('Knip configured');
}
