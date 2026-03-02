import { deepmerge } from 'deepmerge-ts'

import { rslib } from '../../config'

import type { RslibConfig } from '@rslib/core'

const modules = ['emittery', 'mobx', 'react', 'storage', 'utils']

export default deepmerge(rslib, {
	lib: [{ format: 'esm', dts: true }],
	output: { target: 'web' },
	source: {
		entry: modules.reduce(
			(total, item) => {
				total[item] = `./src/${item}/index.ts`

				return total
			},
			{} as Record<string, string>
		)
	}
} as Partial<RslibConfig>)
