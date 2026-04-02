import {join} from 'node:path'
import * as p from '@clack/prompts'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {readFile, writeFile} from 'node:fs/promises'

import type {PromptResult} from './index.js'
import {JSON_INDENT, TOOLING_PACKAGE_NAME} from '../constants.js'

interface PackageJson {
	devDependencies?: Record<string, string>
}

const pkgVersion = (
	JSON.parse(
		readFileSync(
			fileURLToPath(new URL('../../package.json', import.meta.url)),
			'utf-8',
		),
	) as {version: string}
).version

export async function updatePkgJson(_: PromptResult) {
	const cwd = process.cwd()
	const pathPackageJSON = join(cwd, 'package.json')
	const userPkgJson = JSON.parse(
		await readFile(pathPackageJSON, 'utf-8'),
	) as PackageJson

	userPkgJson.devDependencies ??= {}
	userPkgJson.devDependencies[TOOLING_PACKAGE_NAME] = `^${pkgVersion}`

	await writeFile(
		pathPackageJSON,
		JSON.stringify(userPkgJson, null, JSON_INDENT),
	)

	p.log.success('Package.json updated')
}
