export type ConfigTool = 'editorconfig' | 'oxc' | 'knip' | 'vscode';

export type PresetName = 'react' | 'adonisjs' | 'vitest';

export type PresetFlags = Readonly<Record<PresetName, boolean>>;

export interface PromptResult {
	tools: ConfigTool[];
	presetFlags: PresetFlags;
}

export interface PackageManifest {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
	[key: string]: unknown;
}
