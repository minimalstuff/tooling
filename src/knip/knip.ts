import type { KnipConfiguration, WorkspaceProjectConfig } from 'knip';

import { ADONISJS_WORKSPACE_CONFIG } from './adonisjs_workspace.ts';

export interface MinimalstuffKnipOptions extends KnipConfiguration {
	/**
	 * Apply the AdonisJS conventions (entries, ignores, string-only dependencies).
	 * `true` targets the root workspace, a list of paths targets each of those
	 * workspaces (monorepo).
	 */
	adonisjs?: boolean | readonly string[];
}

type SettingsRecord = Record<string, unknown>;

function toArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [value];
}

function mergeSettings<Settings extends object>(
	presetSettings: Readonly<Settings>,
	userSettings: Readonly<Settings>
): Settings {
	const merged: SettingsRecord = { ...presetSettings };
	for (const [key, userValue] of Object.entries(userSettings)) {
		const presetValue = merged[key];
		merged[key] = Array.isArray(presetValue)
			? [...presetValue, ...toArray(userValue)]
			: userValue;
	}
	return merged as Settings;
}

function applyToRootWorkspace(
	userConfig: KnipConfiguration
): KnipConfiguration {
	return mergeSettings(ADONISJS_WORKSPACE_CONFIG, userConfig);
}

function applyToWorkspaces(
	userConfig: KnipConfiguration,
	workspacePaths: readonly string[]
): KnipConfiguration {
	const workspaces: Record<string, WorkspaceProjectConfig> = {
		...userConfig.workspaces,
	};
	for (const workspacePath of workspacePaths) {
		workspaces[workspacePath] = mergeSettings(
			ADONISJS_WORKSPACE_CONFIG,
			workspaces[workspacePath] ?? {}
		);
	}
	return { ...userConfig, workspaces };
}

function applyAdonisjs(
	userConfig: KnipConfiguration,
	adonisjs: boolean | readonly string[]
): KnipConfiguration {
	if (adonisjs === false) return userConfig;
	if (adonisjs === true) return applyToRootWorkspace(userConfig);
	return applyToWorkspaces(userConfig, adonisjs);
}

/**
 * Builds the root knip config. With `adonisjs`, the AdonisJS conventions are
 * merged into the targeted workspace(s): arrays (`entry`, `project`, `ignore`,
 * `ignoreDependencies`, ...) are concatenated with yours, other keys of yours
 * win.
 */
export function minimalstuffPreset(
	options: MinimalstuffKnipOptions = {}
): KnipConfiguration {
	const { adonisjs = false, ...userConfig } = options;
	return applyAdonisjs(userConfig, adonisjs);
}
