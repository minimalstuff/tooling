import { OXC_FMT_IMPORT, OXC_LINT_IMPORT } from '../constants.ts';
import {
	buildPresetConfigFile,
	type PresetOption,
} from './preset_config_file.ts';
import type { PresetFlags, PresetName } from './types.ts';

const OXLINT_PRESET_ORDER: readonly PresetName[] = [
	'adonisjs',
	'react',
	'vitest',
];

function toPresetOptions(enabledNames: readonly PresetName[]): PresetOption[] {
	return enabledNames.map((name) => ({ key: name, value: 'true' }));
}

export function buildOxlintConfigContent(flags: PresetFlags): string {
	const enabledNames = OXLINT_PRESET_ORDER.filter((name) => flags[name]);
	return buildPresetConfigFile(OXC_LINT_IMPORT, toPresetOptions(enabledNames));
}

export function buildOxfmtConfigContent(flags: PresetFlags): string {
	const enabledNames: PresetName[] = flags.adonisjs ? ['adonisjs'] : [];
	return buildPresetConfigFile(OXC_FMT_IMPORT, toPresetOptions(enabledNames));
}
