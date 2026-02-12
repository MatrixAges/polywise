import { pluginReact } from '@rsbuild/plugin-react'

import type { RsbuildConfig } from '@rsbuild/core'

export default {
	source: { entry: { index: './src/index.tsx' } },
	html: {
		title: 'ChaosBench',
		template: './public/index.html'
	},
	plugins: [pluginReact()]
} as RsbuildConfig
