import { spawnSync } from 'node:child_process';
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { writeFileIn } from '#release_workflow/edit_files.ts';
import { readVerificationScript } from '#release_workflow/read_verification_script.ts';
import { REPOSITORY } from '#release_workflow/release_fixtures.ts';
import { buildGitEnvironment, runGit } from '#release_workflow/run_git.ts';

const BUNDLE_FILE_NAME = 'release.bundle';
const CANDIDATE_BRANCH = 'release-candidate';
const EXTRA_BRANCH = 'extra';

export type CandidateEdit = (directory: string) => void;

type CandidateOptions = {
	readonly commits: readonly CandidateEdit[];
	readonly startFrom?: 'base' | 'diverged';
	readonly extraBranchCommits?: readonly CandidateEdit[];
	readonly omitCandidateBranch?: boolean;
};

type VerifyOptions = {
	readonly versionFiles?: string;
	readonly changelogFiles?: string;
	readonly tagPrefix?: string;
};

type VerificationResult = {
	readonly exitCode: number | null;
	readonly output: string;
	readonly outputs: Readonly<Record<string, string>>;
};

export type ReleaseScenario = {
	readonly bundleDirectory: string;
	readonly publishDirectory: string;
	readonly baseSha: string;
	readonly addCandidate: (options: Readonly<CandidateOptions>) => string;
	readonly verify: (options?: Readonly<VerifyOptions>) => VerificationResult;
	readonly cleanup: () => void;
};

export type ScenarioOptions = {
	readonly baseFiles: Readonly<Record<string, string>>;
	readonly isPublishCheckoutShallow?: boolean;
};

function commitAll(directory: string, message: string): void {
	runGit(directory, ['add', '--all']);
	runGit(directory, ['commit', '--quiet', '--message', message]);
}

function parseOutputs(content: string): Record<string, string> {
	const outputs: Record<string, string> = {};
	for (const line of content.split('\n')) {
		const separatorIndex = line.indexOf('=');
		if (separatorIndex < 0) continue;
		outputs[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
	}
	return outputs;
}

function createSourceRepository(
	directory: string,
	baseFiles: Readonly<Record<string, string>>
): { baseSha: string; previousSha: string } {
	mkdirSync(directory);
	runGit(directory, ['init', '--quiet', '--initial-branch=main']);
	writeFileIn(directory, 'README.md', 'previous\n');
	commitAll(directory, 'chore: previous');
	const previousSha = runGit(directory, ['rev-parse', 'HEAD']);
	for (const [path, content] of Object.entries(baseFiles)) {
		writeFileIn(directory, path, content);
	}
	commitAll(directory, 'chore: base');
	return { baseSha: runGit(directory, ['rev-parse', 'HEAD']), previousSha };
}

function createPublishCheckout(
	root: string,
	sourceDirectory: string,
	baseSha: string,
	isShallow: boolean
): string {
	const publishDirectory = join(root, 'publish');
	const depthArguments = isShallow ? ['--depth', '1'] : [];
	runGit(root, [
		'clone',
		'--quiet',
		...depthArguments,
		`file://${sourceDirectory}`,
		publishDirectory,
	]);
	runGit(publishDirectory, ['checkout', '--quiet', '--detach', baseSha]);
	return publishDirectory;
}

export function createReleaseScenario(
	options: Readonly<ScenarioOptions>
): ReleaseScenario {
	const root = mkdtempSync(join(tmpdir(), 'release-scenario-'));
	const sourceDirectory = join(root, 'source');
	const bundleDirectory = join(root, 'bundle');
	const { baseSha, previousSha } = createSourceRepository(
		sourceDirectory,
		options.baseFiles
	);
	const publishDirectory = createPublishCheckout(
		root,
		sourceDirectory,
		baseSha,
		options.isPublishCheckoutShallow ?? false
	);
	mkdirSync(bundleDirectory);
	const scriptPath = join(root, 'verify.sh');
	writeFileSync(scriptPath, readVerificationScript());

	function createBranch(
		name: string,
		startPoint: string,
		commits: readonly CandidateEdit[]
	): void {
		runGit(sourceDirectory, [
			'switch',
			'--quiet',
			'--create',
			name,
			startPoint,
		]);
		for (const edit of commits) {
			edit(sourceDirectory);
			commitAll(sourceDirectory, `chore(release): ${name}`);
		}
	}

	function addCandidate(candidate: Readonly<CandidateOptions>): string {
		let startPoint = baseSha;
		if (candidate.startFrom === 'diverged') {
			createBranch('diverged', previousSha, [
				(directory) => writeFileIn(directory, 'diverged.txt', 'diverged\n'),
			]);
			startPoint = 'diverged';
		}
		createBranch(CANDIDATE_BRANCH, startPoint, candidate.commits);
		const refs = [`refs/heads/${CANDIDATE_BRANCH}`];
		if (candidate.extraBranchCommits) {
			createBranch(EXTRA_BRANCH, baseSha, candidate.extraBranchCommits);
			refs.push(`refs/heads/${EXTRA_BRANCH}`);
		}
		const bundledRefs = candidate.omitCandidateBranch ? refs.slice(1) : refs;
		runGit(sourceDirectory, [
			'bundle',
			'create',
			'--quiet',
			join(bundleDirectory, BUNDLE_FILE_NAME),
			`^${baseSha}`,
			...bundledRefs,
		]);
		return runGit(sourceDirectory, ['rev-parse', CANDIDATE_BRANCH]);
	}

	function verify(
		verifyOptions: Readonly<VerifyOptions> = {}
	): VerificationResult {
		const outputFile = join(root, 'github_output');
		writeFileSync(outputFile, '');
		const run = spawnSync('bash', [scriptPath], {
			cwd: publishDirectory,
			encoding: 'utf8',
			env: {
				...buildGitEnvironment(),
				BASE_SHA: baseSha,
				BUNDLE_DIRECTORY: bundleDirectory,
				VERSION_FILES: verifyOptions.versionFiles ?? 'package.json',
				CHANGELOG_FILES: verifyOptions.changelogFiles ?? 'CHANGELOG.md',
				TAG_PREFIX: verifyOptions.tagPrefix ?? 'v',
				GITHUB_REPOSITORY: REPOSITORY,
				GITHUB_OUTPUT: outputFile,
			},
		});
		return {
			exitCode: run.status,
			output: `${run.stdout}${run.stderr}`,
			outputs: parseOutputs(readFileSync(outputFile, 'utf8')),
		};
	}

	return {
		bundleDirectory,
		publishDirectory,
		baseSha,
		addCandidate,
		verify,
		cleanup: () => rmSync(root, { recursive: true, force: true }),
	};
}
