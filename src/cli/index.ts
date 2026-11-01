#!/usr/bin/env node

import { confirm, intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import { TOOLING_PACKAGE_NAME } from '../constants.ts';
import { installDevPackages } from './install_dev_packages.ts';
import { listDevPackages } from './list_dev_packages.ts';
import { promptPresetsForTools } from './prompt_presets.ts';
import { promptTools } from './prompt_tools.ts';
import { exitWhenCancelled } from './prompts.ts';
import type { PromptResult } from './types.ts';
import { updateEditorConfig } from './update_editorconfig.ts';
import { updateKnip } from './update_knip.ts';
import { updateOxc } from './update_oxc.ts';
import { updatePackageScripts } from './update_package_scripts.ts';

const FAILURE_EXIT_CODE = 1;

function exitWhenNotInteractive(): void {
	if (process.stdin.isTTY) return;

	log.error(
		'This setup asks questions and needs an interactive terminal. Run it again from a terminal.'
	);
	process.exit(FAILURE_EXIT_CODE);
}

async function main(): Promise<void> {
	exitWhenNotInteractive();

	const cwd = process.cwd();

	intro(color.blue(TOOLING_PACKAGE_NAME));
	log.info(
		`You are about to configure ${TOOLING_PACKAGE_NAME} in the current directory: ${color.green(cwd)}`
	);

	const shouldContinue = exitWhenCancelled(
		await confirm({ message: 'Continue?' })
	);
	if (!shouldContinue) {
		outro('Nothing was changed.');
		return;
	}

	const tools = await promptTools(cwd);

	const presetFlags = await promptPresetsForTools(tools, cwd);
	const result: PromptResult = { tools, presetFlags };

	await updateEditorConfig(result);
	await updatePackageScripts(result);
	await updateOxc(result);
	await updateKnip(result);
	await installDevPackages(listDevPackages(result), cwd);

	log.success('All done.');
}

main().catch((error: unknown) => {
	log.error(error instanceof Error ? error.message : String(error));
	log.info('Files written before the error are kept.');
	process.exit(FAILURE_EXIT_CODE);
});
