const INDENT = '\t';
const INDENT_WIDTH = 2;
const PRINT_WIDTH = 80;

export interface PresetOption {
	key: string;
	value: string | readonly string[];
}

function quote(text: string): string {
	return `'${text}'`;
}

function buildArrayOptionLines(
	key: string,
	items: readonly string[]
): string[] {
	const quotedItems = items.map(quote);
	const inlineLine = `${INDENT}${key}: [${quotedItems.join(', ')}],`;
	const inlineWidth = inlineLine.length - INDENT.length + INDENT_WIDTH;
	if (inlineWidth <= PRINT_WIDTH) return [inlineLine];

	return [
		`${INDENT}${key}: [`,
		...quotedItems.map((item) => `${INDENT}${INDENT}${item},`),
		`${INDENT}],`,
	];
}

function buildOptionLines(option: PresetOption): string[] {
	if (typeof option.value === 'string')
		return [`${INDENT}${option.key}: ${option.value},`];
	return buildArrayOptionLines(option.key, option.value);
}

function buildPresetCall(options: readonly PresetOption[]): string {
	if (options.length === 0) return 'minimalstuffPreset()';

	const lines = options.flatMap(buildOptionLines);
	return `minimalstuffPreset({\n${lines.join('\n')}\n})`;
}

export function buildPresetConfigFile(
	importPath: string,
	options: readonly PresetOption[]
): string {
	return `import { minimalstuffPreset } from '${importPath}';\n\nexport default ${buildPresetCall(options)};\n`;
}
