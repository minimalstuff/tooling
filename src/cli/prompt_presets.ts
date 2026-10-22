import { multiselect } from '@clack/prompts';

import {
	detectPresets,
	toDetectedPresetNames,
	toPresetFlags,
} from './detect_presets.ts';
import { exitWhenCancelled } from './prompts.ts';
import type { ConfigTool, PresetFlags, PresetName } from './types.ts';

const TOOLS_USING_PRESETS: readonly ConfigTool[] = ['oxc', 'knip'];

const NO_PRESETS: PresetFlags = toPresetFlags([]);

async function promptPresets(cwd: string): Promise<PresetFlags> {
	const detectedPresets = await detectPresets(cwd);
	const selectedNames = exitWhenCancelled(
		await multiselect<PresetName>({
			message: 'Select presets to enable',
			options: [
				{ value: 'react', label: 'React' },
				{ value: 'adonisjs', label: 'AdonisJS' },
				{ value: 'vitest', label: 'Vitest' },
			],
			initialValues: toDetectedPresetNames(detectedPresets),
			required: false,
		})
	);
	return toPresetFlags(selectedNames);
}

export async function promptPresetsForTools(
	tools: readonly ConfigTool[],
	cwd: string
): Promise<PresetFlags> {
	const isUsingPresets = TOOLS_USING_PRESETS.some((tool) =>
		tools.includes(tool)
	);
	if (!isUsingPresets) return NO_PRESETS;

	return promptPresets(cwd);
}
