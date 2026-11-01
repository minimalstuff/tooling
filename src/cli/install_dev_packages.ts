import { detectPackageManager, installPackage } from '@antfu/install-pkg';
import { log } from '@clack/prompts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_AGENT = 'npm';
const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml';

class InstallPackagesError extends Error {
	constructor(command: string, cause: unknown) {
		super(`Installing packages failed. Run it yourself: ${command}`, {
			cause,
		});
		this.name = 'InstallPackagesError';
	}
}

export function buildDevInstallCommand(
	agent: string,
	packageNames: readonly string[],
	hasPnpmWorkspace: boolean
): string {
	const subcommand = agent === 'yarn' ? 'add' : 'install';
	const workspaceFlag = agent === 'pnpm' && hasPnpmWorkspace ? ['-w'] : [];

	return [agent, subcommand, '-D', ...workspaceFlag, ...packageNames].join(' ');
}

async function detectAgent(cwd: string): Promise<string> {
	const detectedPackageManager = await detectPackageManager(cwd);
	return (
		(detectedPackageManager ?? DEFAULT_AGENT).split('@')[0] ?? DEFAULT_AGENT
	);
}

export async function installDevPackages(
	packageNames: readonly string[],
	cwd: string
): Promise<void> {
	if (packageNames.length === 0) return;

	log.step(`Installing ${packageNames.join(', ')}`);
	const agent = await detectAgent(cwd);

	try {
		await installPackage([...packageNames], {
			dev: true,
			cwd,
			packageManager: agent,
		});
	} catch (error) {
		const hasPnpmWorkspace = existsSync(join(cwd, PNPM_WORKSPACE_FILE));
		throw new InstallPackagesError(
			buildDevInstallCommand(agent, packageNames, hasPnpmWorkspace),
			error
		);
	}
}
