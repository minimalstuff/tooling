#!/usr/bin/env node

import color from 'picocolors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	multiselect,
} from '@clack/prompts';

import { updateOxc } from './update_oxc.js';
import { updatePkgJson } from './update_pkg.json.js';
import { TOOLING_PACKAGE_NAME } from '../constants.js';
import { updateEditorConfig } from './update_editorconfig.js';

export type ConfigTool = 'editorconfig' | 'oxc' | 'vscode';

export const DEFAULT_SELECTED_TOOLS: ConfigTool[] = [
	'editorconfig',
	'oxc',
	'vscode',
];

export interface PromptResult {
	tools: ConfigTool[];
}

function exit() {
	cancel('Cancelled');
	return process.exit(0);
}

function findGitRoot(startDir: string): string | null {
	let dir = startDir;
	while (true) {
		if (existsSync(join(dir, '.git'))) return dir;
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

async function main() {
	const cwd = process.cwd();

	intro(color.blue(TOOLING_PACKAGE_NAME));

	log.info(
		`You are about to configure ${TOOLING_PACKAGE_NAME} in the current directory: ${color.green(
			cwd
		)}`
	);

	const shouldContinue = await confirm({ message: `Continue ?` });
	if (isCancel(shouldContinue)) return exit();

	const gitRoot = findGitRoot(cwd);
	const rootToCheck = gitRoot && gitRoot !== cwd ? gitRoot : null;

	const hasEditorConfig =
		existsSync(join(cwd, '.editorconfig')) ||
		(rootToCheck !== null && existsSync(join(rootToCheck, '.editorconfig')));

	const hasVscode =
		existsSync(join(cwd, '.vscode')) ||
		(rootToCheck !== null && existsSync(join(rootToCheck, '.vscode')));

	const initialValues = DEFAULT_SELECTED_TOOLS.filter((tool) => {
		if (tool === 'editorconfig' && hasEditorConfig) return false;
		if (tool === 'vscode' && hasVscode) return false;
		return true;
	});

	const tools = await multiselect<ConfigTool>({
		message: 'Select tools to configure',
		options: [
			{
				value: 'editorconfig' as const,
				label: 'EditorConfig',
				...(hasEditorConfig && { hint: 'already exists' }),
			},
			{ value: 'oxc' as const, label: 'OXC (oxlint + oxfmt)' },
			{
				value: 'vscode' as const,
				label: 'VSCode settings (.vscode/settings.json)',
				...(hasVscode && { hint: 'already exists' }),
			},
		],
		initialValues,
		required: true,
	});
	if (isCancel(tools)) return exit();

	await updatePkgJson({ tools });
	await updateEditorConfig({ tools });
	await updateOxc({ tools });

	log.success(
		'All done. Make sure to install the dependencies with `pnpm install`.'
	);
}

void main();
