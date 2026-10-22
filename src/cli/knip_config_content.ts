import { KNIP_IMPORT } from '../constants.ts';
import { ROOT_WORKSPACE_PATH } from './detect_presets.ts';
import { buildPresetConfigFile } from './preset_config_file.ts';

export type KnipAdonisjsOption = true | readonly string[];

export function toKnipAdonisjsOption(
	adonisjsWorkspacePaths: readonly string[]
): KnipAdonisjsOption | undefined {
	if (adonisjsWorkspacePaths.includes(ROOT_WORKSPACE_PATH)) return true;
	if (adonisjsWorkspacePaths.length === 0) return undefined;
	return adonisjsWorkspacePaths;
}

function buildPresetCall(adonisjs: KnipAdonisjsOption | undefined): string {
	if (adonisjs === undefined) return 'minimalstuffPreset()';
	if (adonisjs === true) return 'minimalstuffPreset({ adonisjs: true })';

	const quotedPaths = adonisjs.map((path) => `'${path}'`).join(', ');
	return `minimalstuffPreset({ adonisjs: [${quotedPaths}] })`;
}

export function buildKnipConfigContent(
	adonisjs: KnipAdonisjsOption | undefined
): string {
	return buildPresetConfigFile(KNIP_IMPORT, buildPresetCall(adonisjs));
}
