import type { Option } from '@clack/prompts';

import type { ConfigTool } from './types.ts';

export interface ExistingConfigs {
	readonly hasEditorConfig: boolean;
	readonly hasKnip: boolean;
	readonly hasVscode: boolean;
}

const MAIN_TOOLS: readonly ConfigTool[] = ['editorconfig', 'oxc', 'knip'];
const ALREADY_EXISTS_SUFFIX = ' (already exists)';

function withExistingSuffix(label: string, isExisting: boolean): string {
	return isExisting ? `${label}${ALREADY_EXISTS_SUFFIX}` : label;
}

export function buildToolOptions(
	existing: ExistingConfigs
): Option<ConfigTool>[] {
	return [
		{
			value: 'editorconfig',
			label: withExistingSuffix('EditorConfig', existing.hasEditorConfig),
		},
		{ value: 'oxc', label: 'OXC (oxlint + oxfmt)' },
		{
			value: 'knip',
			label: withExistingSuffix(
				'Knip (unused files, exports, dependencies)',
				existing.hasKnip
			),
		},
	];
}

function isInitiallySelected(
	tool: ConfigTool,
	existing: ExistingConfigs
): boolean {
	if (tool === 'editorconfig') return !existing.hasEditorConfig;
	if (tool === 'knip') return !existing.hasKnip;
	return true;
}

export function selectInitialTools(existing: ExistingConfigs): ConfigTool[] {
	return MAIN_TOOLS.filter((tool) => isInitiallySelected(tool, existing));
}

export function canConfigureVscode(tools: readonly ConfigTool[]): boolean {
	return tools.includes('oxc');
}
