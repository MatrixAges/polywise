import { defineConfig } from '@rstest/core'

export default defineConfig({
	root: './test',
	setupFiles: ['./setup.ts'],
	testTimeout: 30000
})
