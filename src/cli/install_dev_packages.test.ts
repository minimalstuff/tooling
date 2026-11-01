import { describe, expect, it } from 'vitest';

import { buildDevInstallCommand } from '#cli/install_dev_packages.ts';

const PACKAGE_NAMES = ['oxlint', 'knip'];

describe('buildDevInstallCommand', () => {
	it('should build a plain pnpm install when there is no pnpm workspace', () => {
		expect(buildDevInstallCommand('pnpm', PACKAGE_NAMES, false)).toBe(
			'pnpm install -D oxlint knip'
		);
	});

	it('should add the -w flag when pnpm runs in a workspace', () => {
		expect(buildDevInstallCommand('pnpm', PACKAGE_NAMES, true)).toBe(
			'pnpm install -D -w oxlint knip'
		);
	});

	it('should use add when the agent is yarn', () => {
		expect(buildDevInstallCommand('yarn', PACKAGE_NAMES, false)).toBe(
			'yarn add -D oxlint knip'
		);
	});

	it('should use install when the agent is npm', () => {
		expect(buildDevInstallCommand('npm', PACKAGE_NAMES, true)).toBe(
			'npm install -D oxlint knip'
		);
	});
});
