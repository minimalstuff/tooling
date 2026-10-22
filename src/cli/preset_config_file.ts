export function buildPresetConfigFile(
	importPath: string,
	presetCall: string
): string {
	return `import { minimalstuffPreset } from '${importPath}';\n\nexport default ${presetCall};\n`;
}
