import type { ConfigTool } from './types.ts';

const OXC_SCRIPTS: Readonly<Record<string, string>> = {
	lint: 'oxlint',
	'lint:fix': 'oxlint --fix',
	format: 'oxfmt && oxlint --fix',
	'format:check': 'oxfmt --check',
	typecheck: 'tsc --noEmit',
};

const OXC_CHECK_SCRIPT_NAMES: readonly string[] = [
	'lint',
	'format:check',
	'typecheck',
];

function toRunCommand(scriptName: string): string {
	return `pnpm ${scriptName}`;
}

function buildCheckScript(
	scriptNames: readonly string[]
): Record<string, string> {
	return { check: scriptNames.map(toRunCommand).join(' && ') };
}

export function buildScripts(
	tools: readonly ConfigTool[]
): Record<string, string> {
	if (!tools.includes('oxc')) return {};

	return { ...OXC_SCRIPTS, ...buildCheckScript(OXC_CHECK_SCRIPT_NAMES) };
}

export interface ScriptsMerge {
	scripts: Record<string, string>;
	addedNames: string[];
	skippedNames: string[];
}

export function mergeScripts(
	existingScripts: Readonly<Record<string, string>> | undefined,
	scriptsToAdd: Readonly<Record<string, string>>
): ScriptsMerge {
	const scripts = { ...existingScripts };
	const addedNames: string[] = [];
	const skippedNames: string[] = [];

	for (const [name, command] of Object.entries(scriptsToAdd)) {
		if (name in scripts) {
			skippedNames.push(name);
			continue;
		}
		scripts[name] = command;
		addedNames.push(name);
	}
	return { scripts, addedNames, skippedNames };
}
