import {defineConfig} from 'oxlint'
import {minimalstuffPreset} from './dist/oxc/lint.js'

export default defineConfig({
	extends: [minimalstuffPreset()],
})
