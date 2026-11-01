import { confirm, multiselect } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { exitWhenCancelled } from '#cli/prompts.ts';
import {
	buildToolOptions,
	canConfigureVscode,
	type ExistingConfigs,
	selectInitialTools,
} from '#cli/tool_options.ts';
import type { ConfigTool } from '#cli/types.ts';
import { KNIP_CONFIG_FILE_NAMES } from '#constants.ts';

const VSCODE_CONFIRM_MESSAGE = 'Add OXC settings to .vscode/settings.json?';
const VSCODE_EXISTING_NOTE = ' (it already exists, existing settings are kept)';

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

function detectExistingConfigs(cwd: string): ExistingConfigs {
	const gitRoot = findGitRoot(cwd);
	const roots = gitRoot && gitRoot !== cwd ? [cwd, gitRoot] : [cwd];

	return {
		hasEditorConfig: existsAtAnyRoot(roots, ['.editorconfig']),
		hasVscode: existsAtAnyRoot(roots, ['.vscode']),
		hasKnip: existsAtAnyRoot(roots, KNIP_CONFIG_FILE_NAMES),
	};
}

async function promptMainTools(
	existing: ExistingConfigs
): Promise<ConfigTool[]> {
	return exitWhenCancelled(
		await multiselect<ConfigTool>({
			message: 'Select tools to configure',
			options: buildToolOptions(existing),
			initialValues: selectInitialTools(existing),
			required: true,
		})
	);
}

async function promptVscodeSettings(
	existing: ExistingConfigs
): Promise<boolean> {
	return exitWhenCancelled(
		await confirm({
			message: existing.hasVscode
				? `${VSCODE_CONFIRM_MESSAGE}${VSCODE_EXISTING_NOTE}`
				: VSCODE_CONFIRM_MESSAGE,
			initialValue: !existing.hasVscode,
		})
	);
}

export async function promptTools(cwd: string): Promise<ConfigTool[]> {
	const existing = detectExistingConfigs(cwd);
	const tools = await promptMainTools(existing);
	if (!canConfigureVscode(tools)) return tools;

	const shouldConfigureVscode = await promptVscodeSettings(existing);
	return shouldConfigureVscode ? [...tools, 'vscode'] : tools;
}
