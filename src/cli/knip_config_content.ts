import { KNIP_IMPORT } from '../constants.ts';
import { ROOT_WORKSPACE_PATH } from './detect_presets.ts';
import {
	buildPresetConfigFile,
	type PresetOption,
} from './preset_config_file.ts';

export type KnipAdonisjsOption = true | readonly string[];

export function toKnipAdonisjsOption(
	adonisjsWorkspacePaths: readonly string[]
): KnipAdonisjsOption | undefined {
	if (adonisjsWorkspacePaths.includes(ROOT_WORKSPACE_PATH)) return true;
	if (adonisjsWorkspacePaths.length === 0) return undefined;
	return adonisjsWorkspacePaths;
}

function toPresetOptions(
	adonisjs: KnipAdonisjsOption | undefined
): PresetOption[] {
	if (adonisjs === undefined) return [];
	if (adonisjs === true) return [{ key: 'adonisjs', value: 'true' }];
	return [{ key: 'adonisjs', value: adonisjs }];
}

export function buildKnipConfigContent(
	adonisjs: KnipAdonisjsOption | undefined
): string {
	return buildPresetConfigFile(KNIP_IMPORT, toPresetOptions(adonisjs));
}
