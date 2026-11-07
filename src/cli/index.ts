#!/usr/bin/env node

import { confirm, intro, log, outro } from '@clack/prompts';
import color from 'picocolors';

import {
	CHECK_RELEASE_SUBCOMMAND,
	EXIT_CODE_INVALID_INPUT,
} from '#check_release/constants.ts';
import { runCheckRelease } from '#check_release/run_check_release.ts';
import { installDevPackages } from '#cli/install_dev_packages.ts';
import { listDevPackages } from '#cli/list_dev_packages.ts';
import { promptPresetsForTools } from '#cli/prompt_presets.ts';
import { promptTools } from '#cli/prompt_tools.ts';
import { exitWhenCancelled } from '#cli/prompts.ts';
import type { PromptResult } from '#cli/types.ts';
import { updateEditorConfig } from '#cli/update_editorconfig.ts';
import { updateKnip } from '#cli/update_knip.ts';
import { updateOxc } from '#cli/update_oxc.ts';
import { updatePackageScripts } from '#cli/update_package_scripts.ts';
import { TOOLING_PACKAGE_NAME } from '#constants.ts';

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

function runSetup(): void {
	main().catch((error: unknown) => {
		log.error(error instanceof Error ? error.message : String(error));
		log.info('Files written before the error are kept.');
		process.exit(FAILURE_EXIT_CODE);
	});
}

async function runCheckReleaseCommand(): Promise<void> {
	process.exitCode = await runCheckRelease(process.cwd());
}

function exitWithUnknownSubcommand(subcommand: string): never {
	console.error(
		`Unknown subcommand "${subcommand}". Valid subcommands: ${CHECK_RELEASE_SUBCOMMAND}. Run without argument for the interactive setup.`
	);
	process.exit(EXIT_CODE_INVALID_INPUT);
}

const subcommand = process.argv[2];

if (subcommand === undefined) {
	runSetup();
} else if (subcommand === CHECK_RELEASE_SUBCOMMAND) {
	await runCheckReleaseCommand();
} else {
	exitWithUnknownSubcommand(subcommand);
}
