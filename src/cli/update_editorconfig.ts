import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PromptResult } from './types.ts';
import { writeGeneratedFile } from './write_generated_file.ts';

const presetPath = fileURLToPath(
	new URL('../../preset/.editorconfig', import.meta.url)
);

export async function updateEditorConfig(result: PromptResult): Promise<void> {
	if (!result.tools.includes('editorconfig')) return;

	const content = await readFile(presetPath, 'utf-8');
	await writeGeneratedFile(join(process.cwd(), '.editorconfig'), content);
}
