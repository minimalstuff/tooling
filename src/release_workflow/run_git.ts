import { execFileSync } from 'node:child_process';

const COMMITTER_NAME = 'Release Fixture';
const COMMITTER_EMAIL = 'fixture@example.com';

export function buildGitEnvironment(): Record<string, string> {
	return {
		PATH: process.env['PATH'] ?? '',
		GIT_CONFIG_GLOBAL: '/dev/null',
		GIT_CONFIG_NOSYSTEM: '1',
		GIT_AUTHOR_NAME: COMMITTER_NAME,
		GIT_AUTHOR_EMAIL: COMMITTER_EMAIL,
		GIT_COMMITTER_NAME: COMMITTER_NAME,
		GIT_COMMITTER_EMAIL: COMMITTER_EMAIL,
	};
}

export function runGit(directory: string, args: readonly string[]): string {
	return execFileSync('git', [...args], {
		cwd: directory,
		env: buildGitEnvironment(),
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	}).trim();
}
