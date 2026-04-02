import {join} from 'node:path'
import * as p from '@clack/prompts'
import {existsSync} from 'node:fs'
import {installPackage} from '@antfu/install-pkg'
import {mkdir, readFile, writeFile} from 'node:fs/promises'

import type {PromptResult} from './index.js'
import {
	JSON_INDENT,
	OXC_FMT_IMPORT,
	OXC_LINT_IMPORT,
	OXC_VSCODE_SETTINGS,
	TOOLING_PACKAGE_NAME,
} from '../constants.js'

interface PackageJson {
	scripts?: Record<string, string>
}

const oxlintConfigContent = `import { defineConfig } from 'oxlint'
import { minimalstuffPreset } from '${OXC_LINT_IMPORT}'

export default defineConfig({
\textends: [minimalstuffPreset()],
})
`

const oxfmtConfigContent = `import { minimalstuffPreset } from '${OXC_FMT_IMPORT}'

export default minimalstuffPreset()
`

const oxcScripts: Record<string, string> = {
	'format': 'oxfmt --write .',
	'lint': 'oxlint',
	'lint:fix': 'oxlint --fix',
}

const oxcPackages = ['oxfmt', 'oxlint', TOOLING_PACKAGE_NAME]

export async function updateOxc(result: PromptResult) {
	if (!result.tools.includes('oxc')) return

	const cwd = process.cwd()

	await writeFile(join(cwd, 'oxlint.config.ts'), oxlintConfigContent)
	await writeFile(join(cwd, 'oxfmt.config.ts'), oxfmtConfigContent)

	await updateVscodeSettings(cwd)
	await addScriptsToPackageJson(cwd)
	await installPackage(oxcPackages, {dev: true, cwd})

	p.log.success('OXC configured (oxlint + oxfmt) 🦀')
}

async function updateVscodeSettings(cwd: string) {
	const vscodePath = join(cwd, '.vscode')
	const settingsPath = join(vscodePath, 'settings.json')

	if (!existsSync(vscodePath)) {
		await mkdir(vscodePath)
	}

	let settings: Record<string, unknown> = {}
	if (existsSync(settingsPath)) {
		settings = JSON.parse(await readFile(settingsPath, 'utf-8')) as Record<
			string,
			unknown
		>
	}

	for (const [key, value] of Object.entries(OXC_VSCODE_SETTINGS)) {
		if (!(key in settings)) settings[key] = value
	}

	await writeFile(settingsPath, JSON.stringify(settings, null, JSON_INDENT))
}

async function addScriptsToPackageJson(cwd: string) {
	const pkgPath = join(cwd, 'package.json')
	const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as PackageJson

	pkg.scripts ??= {}
	for (const [key, value] of Object.entries(oxcScripts)) {
		pkg.scripts[key] = value
	}

	await writeFile(pkgPath, JSON.stringify(pkg, null, JSON_INDENT))
}
