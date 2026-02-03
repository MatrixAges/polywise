import { defineConfig } from '@rstest/core'

export default defineConfig({
	root: './test',
	setupFiles: ['./utils/setup.ts'],
	reporters: ['verbose'],
	testTimeout: 30000
})
