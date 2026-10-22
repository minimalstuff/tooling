import { OXC_FMT_IMPORT, OXC_LINT_IMPORT } from '../constants.ts';
import type { PresetFlags, PresetName } from './types.ts';

const OXLINT_PRESET_ORDER: readonly PresetName[] = [
	'adonisjs',
	'react',
	'vitest',
];

function buildPresetConfigFile(importPath: string, presetCall: string): string {
	return `import { minimalstuffPreset } from '${importPath}';\n\nexport default ${presetCall};\n`;
}

function buildPresetCall(enabledNames: readonly PresetName[]): string {
	if (enabledNames.length === 0) return 'minimalstuffPreset()';

	const entries = enabledNames.map((name) => `${name}: true`).join(', ');
	return `minimalstuffPreset({ ${entries} })`;
}

export function buildOxlintConfigContent(flags: PresetFlags): string {
	const enabledNames = OXLINT_PRESET_ORDER.filter((name) => flags[name]);
	return buildPresetConfigFile(OXC_LINT_IMPORT, buildPresetCall(enabledNames));
}

export function buildOxfmtConfigContent(flags: PresetFlags): string {
	const enabledNames: PresetName[] = flags.adonisjs ? ['adonisjs'] : [];
	return buildPresetConfigFile(OXC_FMT_IMPORT, buildPresetCall(enabledNames));
}
