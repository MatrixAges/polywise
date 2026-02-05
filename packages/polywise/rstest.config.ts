import { defineConfig } from '@rstest/core'

import afterTest from './scripts/afterTest'

import type { Reporter } from '@rstest/core'

const hooks_reporter: Reporter = {
	onTestRunEnd() {
		afterTest()
	}
}

export default defineConfig({
	root: './test',
	setupFiles: ['./utils/setup.ts'],
	reporters: ['verbose', hooks_reporter],
	source: { decorators: { version: 'legacy' } },
	hookTimeout: 60000,
	testTimeout: 120000
})
