#!/usr/bin/env node

import color from 'picocolors'
import {
	intro,
	log,
	confirm,
	multiselect,
	isCancel,
	cancel,
} from '@clack/prompts'

import {updateEditorConfig} from './update_editorconfig.js'
import {updateOxc} from './update_oxc.js'
import {updatePkgJson} from './update_pkg_json.js'
import {TOOLING_PACKAGE_NAME} from '../constants.js'
import {updateReleaseIt} from './update_release_it.js'

export type ConfigTool = 'editorconfig' | 'oxc' | 'release-it'

export const DEFAULT_SELECTED_TOOLS: ConfigTool[] = [
	'editorconfig',
	'oxc',
	'release-it',
]

export interface PromptResult {
	tools: ConfigTool[]
}

function exit() {
	cancel('Cancelled')
	process.exit(0)
}

async function main() {
	const cwd = process.cwd()

	intro(color.blue(TOOLING_PACKAGE_NAME))

	log.info(
		`You are about to configure ${TOOLING_PACKAGE_NAME} in the current directory: ${color.green(cwd)}`,
	)

	const shouldContinue = await confirm({message: 'Continue ?'})
	if (isCancel(shouldContinue)) return exit()

	const tools = await multiselect<ConfigTool>({
		message: 'Select tools to configure',
		options: [
			{value: 'editorconfig', label: 'EditorConfig'},
			{value: 'oxc', label: 'OXC (oxlint + oxfmt)'},
			{value: 'release-it', label: 'release-it (Conventional Changelog)'},
		],
		initialValues: DEFAULT_SELECTED_TOOLS,
		required: true,
	})

	if (isCancel(tools)) return exit()

	await updatePkgJson({tools})
	await updateEditorConfig({tools})
	await updateOxc({tools})
	await updateReleaseIt({tools})

	log.success(
		'All done. Make sure to install the dependencies with `pnpm install`.',
	)
}

void main()
