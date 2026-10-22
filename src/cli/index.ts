#!/usr/bin/env node

import { confirm, intro, log, multiselect } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import color from 'picocolors';

import { TOOLING_PACKAGE_NAME } from '../constants.ts';
import { promptPresetsForTools } from './prompt_presets.ts';
import { exitWhenCancelled } from './prompts.ts';
import type { ConfigTool, PromptResult } from './types.ts';
import { updateEditorConfig } from './update_editorconfig.ts';
import { updateOxc } from './update_oxc.ts';
import { updatePackageScripts } from './update_package_scripts.ts';

const DEFAULT_SELECTED_TOOLS: ConfigTool[] = ['editorconfig', 'oxc', 'vscode'];

function findGitRoot(startDirectory: string): string | null {
	let directory = startDirectory;
	while (true) {
		if (existsSync(join(directory, '.git'))) return directory;
		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

function existsAtAnyRoot(
	roots: readonly string[],
	entryNames: readonly string[]
): boolean {
	return roots.some((root) =>
		entryNames.some((entryName) => existsSync(join(root, entryName)))
	);
}

async function promptTools(cwd: string): Promise<ConfigTool[]> {
	const gitRoot = findGitRoot(cwd);
	const roots = gitRoot && gitRoot !== cwd ? [cwd, gitRoot] : [cwd];

	const hasEditorConfig = existsAtAnyRoot(roots, ['.editorconfig']);
	const hasVscode = existsAtAnyRoot(roots, ['.vscode']);

	const initialValues = DEFAULT_SELECTED_TOOLS.filter((tool) => {
		if (tool === 'editorconfig') return !hasEditorConfig;
		if (tool === 'vscode') return !hasVscode;
		return true;
	});

	return exitWhenCancelled(
		await multiselect<ConfigTool>({
			message: 'Select tools to configure',
			options: [
				{
					value: 'editorconfig',
					label: 'EditorConfig',
					...(hasEditorConfig && { hint: 'already exists' }),
				},
				{ value: 'oxc', label: 'OXC (oxlint + oxfmt)' },
				{
					value: 'vscode',
					label: 'VSCode settings (.vscode/settings.json)',
					...(hasVscode && { hint: 'already exists' }),
				},
			],
			initialValues,
			required: true,
		})
	);
}

async function main(): Promise<void> {
	const cwd = process.cwd();

	intro(color.blue(TOOLING_PACKAGE_NAME));
	log.info(
		`You are about to configure ${TOOLING_PACKAGE_NAME} in the current directory: ${color.green(cwd)}`
	);

	const shouldContinue = exitWhenCancelled(
		await confirm({ message: 'Continue ?' })
	);
	if (!shouldContinue) return;

	const tools = await promptTools(cwd);

	const presetFlags = await promptPresetsForTools(tools, cwd);
	const result: PromptResult = { tools, presetFlags };

	await updateEditorConfig(result);
	await updatePackageScripts(result);
	await updateOxc(result);

	log.success(
		'All done. Make sure to install the dependencies with `pnpm install`.'
	);
}

main().catch((error: unknown) => {
	log.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
