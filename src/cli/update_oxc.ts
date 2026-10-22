import { installPackage } from '@antfu/install-pkg';
import { log } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { TOOLING_PACKAGE_NAME } from '../constants.ts';
import {
	buildOxfmtConfigContent,
	buildOxlintConfigContent,
} from './oxc_config_content.ts';
import type { PromptResult } from './types.ts';
import { updateVscodeSettings } from './vscode_settings.ts';
import { writeGeneratedFile } from './write_generated_file.ts';

const OXC_PACKAGES = [
	'oxfmt',
	'oxlint',
	'oxlint-tsgolint',
	TOOLING_PACKAGE_NAME,
];

const OXLINT_CONFIG_FILE = 'oxlint.config.ts';
const OXFMT_CONFIG_FILE = 'oxfmt.config.ts';
const CONFLICTING_OXLINT_CONFIG_FILES = ['.oxlintrc.json', '.oxlintrc.jsonc'];
const CONFLICTING_OXFMT_CONFIG_FILES = ['.oxfmtrc.json', '.oxfmtrc.jsonc'];

function warnAboutConflictingConfigs(cwd: string): void {
	const conflictingFiles = [
		...CONFLICTING_OXLINT_CONFIG_FILES,
		...CONFLICTING_OXFMT_CONFIG_FILES,
	].filter((fileName) => existsSync(join(cwd, fileName)));

	for (const fileName of conflictingFiles) {
		log.warn(
			`${fileName} found: it will conflict with the generated .ts config. Consider removing it.`
		);
	}
}

export async function updateOxc(result: PromptResult): Promise<void> {
	if (!result.tools.includes('oxc')) return;

	const cwd = process.cwd();

	warnAboutConflictingConfigs(cwd);
	await writeGeneratedFile(
		join(cwd, OXLINT_CONFIG_FILE),
		buildOxlintConfigContent(result.presetFlags)
	);
	await writeGeneratedFile(
		join(cwd, OXFMT_CONFIG_FILE),
		buildOxfmtConfigContent(result.presetFlags)
	);

	if (result.tools.includes('vscode')) await updateVscodeSettings(cwd);
	await installPackage(OXC_PACKAGES, { dev: true, cwd });

	log.success('OXC configured (oxlint + oxfmt)');
}
