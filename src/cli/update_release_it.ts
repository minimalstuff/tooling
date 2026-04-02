import {join} from 'node:path'
import * as p from '@clack/prompts'
import {installPackage} from '@antfu/install-pkg'
import {readFile, writeFile} from 'node:fs/promises'

import {JSON_INDENT} from '../constants.js'
import type {PromptResult} from './index.js'

interface PackageJson {
	'release'?: string
	'scripts'?: Record<string, string>
	'devDependencies'?: Record<string, string>
	['release-it']?: ReleaseItConfig
}

interface ReleaseItConfig {
	git: {
		requireCleanWorkingDir: boolean
		requireUpstream: boolean
		commitMessage: string
		tagAnnotation: string
		push: boolean
		tagName: string
	}
	github: {
		release: boolean
	}
	npm: {
		publish: boolean
		skipChecks: boolean
	}
	plugins: {
		'@release-it/conventional-changelog': {
			preset: {
				name: 'conventionalcommits'
			}
		}
	}
}

const releaseItConfig: ReleaseItConfig = {
	git: {
		requireCleanWorkingDir: true,
		requireUpstream: true,
		commitMessage: 'chore(release): ${version}',
		tagAnnotation: 'v${version}',
		push: true,
		tagName: 'v${version}',
	},
	github: {
		release: true,
	},
	npm: {
		publish: true,
		skipChecks: true,
	},
	plugins: {
		'@release-it/conventional-changelog': {
			preset: {
				name: 'conventionalcommits',
			},
		},
	},
}

export async function updateReleaseIt(result: PromptResult) {
	if (!result.tools.includes('release-it')) return

	const cwd = process.cwd()
	const pkgPath = join(cwd, 'package.json')
	const pkg = JSON.parse(await readFile(pkgPath, 'utf-8')) as PackageJson

	pkg.devDependencies ??= {}
	pkg.devDependencies['release-it'] ??= '^19.2.4'
	pkg.devDependencies['@release-it/conventional-changelog'] ??= '^10.0.6'

	pkg.release = 'release-it --ci'
	pkg.scripts ??= {}
	pkg.scripts.release = 'release-it --ci'
	pkg['release-it'] = releaseItConfig

	await writeFile(pkgPath, JSON.stringify(pkg, null, JSON_INDENT))
	await installPackage(['release-it', '@release-it/conventional-changelog'], {
		dev: true,
		cwd,
	})

	p.log.success('release-it configured (conventional commits)')
}
