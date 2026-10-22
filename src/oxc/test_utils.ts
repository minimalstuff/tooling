import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../..');
const NODE_MODULES_PATH = join(REPOSITORY_ROOT, 'node_modules');
const BINARIES_PATH = join(NODE_MODULES_PATH, '.bin');
const FIXTURE_TSCONFIG = JSON.stringify({
	compilerOptions: {
		strict: true,
		noEmit: true,
		module: 'NodeNext',
		moduleResolution: 'NodeNext',
		allowImportingTsExtensions: true,
		skipLibCheck: true,
	},
});

export const LINT_PRESET_PATH = join(REPOSITORY_ROOT, 'src/oxc/lint.ts');
export const FORMAT_PRESET_PATH = join(REPOSITORY_ROOT, 'src/oxc/fmt.ts');

export interface CommandOutcome {
	exitCode: number;
	output: string;
}

export interface Fixture {
	directory: string;
	remove: () => Promise<void>;
}

export async function createFixture(
	files: Record<string, string>
): Promise<Fixture> {
	const directory = await mkdtemp(join(tmpdir(), 'minimalstuff-fixture-'));
	await symlink(NODE_MODULES_PATH, join(directory, 'node_modules'));
	await writeFixtureFiles(directory, {
		'tsconfig.json': FIXTURE_TSCONFIG,
		...files,
	});
	return {
		directory,
		remove: () => rm(directory, { recursive: true, force: true }),
	};
}

async function writeFixtureFiles(
	directory: string,
	files: Record<string, string>
): Promise<void> {
	for (const [relativePath, content] of Object.entries(files)) {
		const filePath = join(directory, relativePath);
		await mkdir(dirname(filePath), { recursive: true });
		await writeFile(filePath, content);
	}
}

export async function runBinary(
	binaryName: 'oxlint' | 'oxfmt',
	directory: string,
	args: string[]
): Promise<CommandOutcome> {
	try {
		const { stdout, stderr } = await execFileAsync(
			join(BINARIES_PATH, binaryName),
			args,
			{ cwd: directory }
		);
		return { exitCode: 0, output: stdout + stderr };
	} catch (error) {
		return toFailedOutcome(error);
	}
}

function toFailedOutcome(error: unknown): CommandOutcome {
	if (!isExecFailure(error)) throw error;
	return { exitCode: error.code, output: error.stdout + error.stderr };
}

function isExecFailure(
	error: unknown
): error is { code: number; stdout: string; stderr: string } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		typeof error.code === 'number' &&
		'stdout' in error &&
		typeof error.stdout === 'string' &&
		'stderr' in error &&
		typeof error.stderr === 'string'
	);
}
