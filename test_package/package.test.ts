import { execFile } from 'node:child_process';
import {
	mkdir,
	mkdtemp,
	readFile,
	readdir,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const REPOSITORY_ROOT = resolve(import.meta.dirname, '..');
const COMMAND_TIMEOUT_MS = 300_000;
const COMMAND_MAX_BUFFER_BYTES = 32 * 1024 * 1024;
const WORKSPACE_FILE =
	'hoist: false\nminimumReleaseAge: 1440\nblockExoticSubdeps: true\n';
const CONSUMER_TSCONFIG = JSON.stringify({
	compilerOptions: {
		strict: true,
		noEmit: true,
		module: 'NodeNext',
		moduleResolution: 'NodeNext',
		allowImportingTsExtensions: true,
		skipLibCheck: true,
	},
});
const BASE_PACKAGES = ['oxlint', 'oxlint-tsgolint', 'typescript'];
const ADONISJS_PLUGIN_PACKAGE = '@adonisjs/eslint-plugin';
const FLOATING_PROMISE_SOURCE =
	'export function run(): void {\n\tPromise.resolve(1);\n}\n';
const ADONISJS_FILES = {
	'start/routes.ts': `import router from '@adonisjs/core/services/router';

import UsersController from '../app/controllers/users_controller.ts';

router.get('/', [UsersController, 'index']);
`,
	'app/controllers/users_controller.ts': `export default class UsersController {
	index(): string {
		return 'users';
	}
}
`,
	'types/router.d.ts': `declare module '@adonisjs/core/services/router' {
	const router: { get(path: string, handler: unknown): void };
	export default router;
}
`,
};

interface CommandOutcome {
	exitCode: number;
	output: string;
}

interface ConsumerOptions {
	name: string;
	packages: readonly string[];
	files: Record<string, string>;
}

async function runCommand(
	command: string,
	args: readonly string[],
	directory: string
): Promise<CommandOutcome> {
	try {
		const { stdout, stderr } = await execFileAsync(command, [...args], {
			cwd: directory,
			timeout: COMMAND_TIMEOUT_MS,
			maxBuffer: COMMAND_MAX_BUFFER_BYTES,
		});
		return { exitCode: 0, output: stdout + stderr };
	} catch (error) {
		return toFailedOutcome(command, args, error);
	}
}

function toFailedOutcome(
	command: string,
	args: readonly string[],
	error: unknown
): CommandOutcome {
	if (!(error instanceof Error)) throw error;
	const { code, stdout, stderr } = error as Error & {
		code?: unknown;
		stdout?: string;
		stderr?: string;
	};
	return {
		exitCode: typeof code === 'number' ? code : 1,
		output: `${command} ${args.join(' ')}\n${stdout ?? ''}${stderr ?? ''}${error.message}`,
	};
}

async function runSuccessfully(
	command: string,
	args: readonly string[],
	directory: string
): Promise<string> {
	const outcome = await runCommand(command, args, directory);
	if (outcome.exitCode !== 0) {
		throw new Error(`Command failed in ${directory}\n${outcome.output}`);
	}
	return outcome.output;
}

async function readInstalledVersion(packageName: string): Promise<string> {
	const manifestPath = join(
		REPOSITORY_ROOT,
		'node_modules',
		packageName,
		'package.json'
	);
	const manifest: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
	const { version } = manifest as { version?: unknown };
	if (typeof version !== 'string') {
		throw new Error(`No version found for ${packageName} in ${manifestPath}`);
	}
	return version;
}

async function pinPackages(
	packageNames: readonly string[]
): Promise<Record<string, string>> {
	const entries = await Promise.all(
		packageNames.map(
			async (name) => [name, await readInstalledVersion(name)] as const
		)
	);
	return Object.fromEntries(entries);
}

async function writeFiles(
	directory: string,
	files: Record<string, string>
): Promise<void> {
	await Promise.all(
		Object.entries(files).map(async ([relativePath, content]) => {
			const filePath = join(directory, relativePath);
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, content);
		})
	);
}

async function findTarball(directory: string): Promise<string> {
	const tarballName = (await readdir(directory)).find((name) =>
		name.endsWith('.tgz')
	);
	if (!tarballName) throw new Error(`No tarball produced in ${directory}`);
	return join(directory, tarballName);
}

describe('@minimalstuff/tooling packed tarball', () => {
	let workDirectory: string;
	let tarballPath: string;

	beforeAll(async () => {
		workDirectory = await mkdtemp(join(tmpdir(), 'minimalstuff-package-'));
		await runSuccessfully('pnpm', ['build'], REPOSITORY_ROOT);
		await runSuccessfully(
			'pnpm',
			['pack', '--pack-destination', workDirectory],
			REPOSITORY_ROOT
		);
		tarballPath = await findTarball(workDirectory);
	});

	afterAll(async () => {
		await rm(workDirectory, { recursive: true, force: true });
	});

	async function createConsumer(options: ConsumerOptions): Promise<string> {
		const directory = join(workDirectory, options.name);
		const devDependencies = {
			...(await pinPackages(options.packages)),
			'@minimalstuff/tooling': `file:${tarballPath}`,
		};
		await writeFiles(directory, {
			'package.json': JSON.stringify({
				name: options.name,
				private: true,
				type: 'module',
				devDependencies,
			}),
			'pnpm-workspace.yaml': WORKSPACE_FILE,
			'tsconfig.json': CONSUMER_TSCONFIG,
			...options.files,
		});
		await runSuccessfully('pnpm', ['install'], directory);
		return directory;
	}

	function lintConsumer(directory: string): Promise<CommandOutcome> {
		return runCommand(
			join(directory, 'node_modules', '.bin', 'oxlint'),
			['-c', 'oxlint.config.ts'],
			directory
		);
	}

	function createConfigFile(presetOptions: string): string {
		return `import { minimalstuffPreset } from '@minimalstuff/tooling/oxc/lint';\n\nexport default minimalstuffPreset(${presetOptions});\n`;
	}

	it('should load the base preset and run type-aware rules when hoisting is disabled', async () => {
		const directory = await createConsumer({
			name: 'base-consumer',
			packages: BASE_PACKAGES,
			files: {
				'oxlint.config.ts': createConfigFile(''),
				'src/a.ts': FLOATING_PROMISE_SOURCE,
			},
		});

		const outcome = await lintConsumer(directory);

		expect(outcome.output).not.toContain('Failed to load');
		expect(outcome.output).toContain('no-floating-promises');
	});

	it('should load the adonisjs plugin and report its rules when it is installed', async () => {
		const directory = await createConsumer({
			name: 'adonisjs-consumer',
			packages: [...BASE_PACKAGES, ADONISJS_PLUGIN_PACKAGE],
			files: {
				'oxlint.config.ts': createConfigFile('{ adonisjs: true }'),
				...ADONISJS_FILES,
			},
		});

		const outcome = await lintConsumer(directory);

		expect(outcome.output).not.toContain('Failed to load');
		expect(outcome.output).toContain(
			'@adonisjs(prefer-lazy-controller-import)'
		);
	});
});
