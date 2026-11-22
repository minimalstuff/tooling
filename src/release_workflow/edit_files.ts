import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function writeFileIn(
	directory: string,
	path: string,
	content: string
): void {
	const target = join(directory, path);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, content);
}

export function replaceInFile(
	directory: string,
	path: string,
	search: string,
	replacement: string
): void {
	const target = join(directory, path);
	const content = readFileSync(target, 'utf8');
	if (!content.includes(search)) {
		throw new Error(`${path} does not contain ${search}`);
	}
	writeFileSync(target, content.replace(search, replacement));
}
