import {
	buildPresetConfigFile,
	type PresetOption,
} from '#cli/preset_config_file.ts';
import type { PresetFlags, PresetName } from '#cli/types.ts';
import { OXC_FMT_IMPORT, OXC_LINT_IMPORT } from '#constants.ts';

const OXLINT_PRESET_ORDER: readonly PresetName[] = [
	'adonisjs',
	'react',
	'vitest',
	'lingui',
];

const DISABLED_SUBPATH_IMPORTS_OPTION: PresetOption = {
	key: 'subpathImports',
	value: 'false',
};

function toPresetOptions(enabledNames: readonly PresetName[]): PresetOption[] {
	return enabledNames.map((name) => ({ key: name, value: 'true' }));
}

export function buildOxlintConfigContent(
	flags: PresetFlags,
	hasSubpathImports: boolean
): string {
	const enabledNames = OXLINT_PRESET_ORDER.filter((name) => flags[name]);
	const options = [
		...toPresetOptions(enabledNames),
		...(hasSubpathImports ? [] : [DISABLED_SUBPATH_IMPORTS_OPTION]),
	];
	return buildPresetConfigFile(OXC_LINT_IMPORT, options);
}

export function buildOxfmtConfigContent(flags: PresetFlags): string {
	const enabledNames: PresetName[] = flags.adonisjs ? ['adonisjs'] : [];
	return buildPresetConfigFile(OXC_FMT_IMPORT, toPresetOptions(enabledNames));
}
