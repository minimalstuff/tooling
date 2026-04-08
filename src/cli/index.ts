#!/usr/bin/env node

import color from 'picocolors';
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

export type ConfigTool = 'editorconfig' | 'oxc';

export const DEFAULT_SELECTED_TOOLS: ConfigTool[] = ['editorconfig', 'oxc'];

export interface PromptResult {
	tools: ConfigTool[];
}

function exit() {
	cancel('Cancelled');
	return process.exit(0);
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

	const tools = await multiselect<ConfigTool>({
		message: 'Select tools to configure',
		options: [
			{ value: 'editorconfig', label: 'EditorConfig' },
			{ value: 'oxc', label: 'OXC (oxlint + oxfmt)' },
		],
		initialValues: DEFAULT_SELECTED_TOOLS,
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
