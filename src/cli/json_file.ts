import {
	type ParseError,
	parse as parseJsonc,
	printParseErrorCode,
} from 'jsonc-parser';
import { readFile, writeFile } from 'node:fs/promises';

export const DEFAULT_INDENTATION = '\t';

const LEADING_WHITESPACE_PATTERN = /^([ \t]+)\S/m;

export type JsonObject = Record<string, unknown>;

export interface JsonDocument {
	content: JsonObject;
	indentation: string;
}

export class InvalidJsonFileError extends Error {
	constructor(filePath: string, reason: string) {
		super(`Invalid JSON in ${filePath}: ${reason}`);
		this.name = 'InvalidJsonFileError';
	}
}

export function detectIndentation(raw: string): string {
	const match = LEADING_WHITESPACE_PATTERN.exec(raw);
	if (!match?.[1]) return DEFAULT_INDENTATION;

	const leadingWhitespace = match[1];
	return leadingWhitespace.startsWith('\t') ? '\t' : leadingWhitespace;
}

export function parseJsonObject(raw: string, filePath: string): JsonObject {
	const parseErrors: ParseError[] = [];
	const parsed: unknown = parseJsonc(raw, parseErrors, {
		allowTrailingComma: true,
		allowEmptyContent: true,
	});

	if (parseErrors.length > 0) {
		const detail = parseErrors
			.map((error) => `${printParseErrorCode(error.error)} @${error.offset}`)
			.join(', ');
		throw new InvalidJsonFileError(filePath, detail);
	}
	if (parsed === undefined) return {};
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new InvalidJsonFileError(filePath, 'expected a JSON object');
	}
	return parsed as JsonObject;
}

export function stringifyJson(
	content: JsonObject,
	indentation: string
): string {
	return `${JSON.stringify(content, null, indentation)}\n`;
}

export async function readJsonDocument(
	filePath: string
): Promise<JsonDocument> {
	const raw = await readFile(filePath, 'utf-8');
	return {
		content: parseJsonObject(raw, filePath),
		indentation: detectIndentation(raw),
	};
}

export async function writeJsonDocument(
	filePath: string,
	document: JsonDocument
): Promise<void> {
	await writeFile(
		filePath,
		stringifyJson(document.content, document.indentation),
		'utf-8'
	);
}
