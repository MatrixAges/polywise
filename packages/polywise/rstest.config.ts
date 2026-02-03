import { defineConfig } from '@rstest/core'

export default defineConfig({
	root: './test',
	setupFiles: ['./utils/setup.ts'],
	testTimeout: 30000
})
