import { deepmerge } from 'deepmerge-ts'

import { createRslib } from '@rslib/core'

import { rslib } from '../../../config'

import type { RslibConfig } from '@rslib/core'

const { build } = await createRslib({
	config: deepmerge(rslib, {
		lib: [
			{
				source: { entry: { preload: `${process.cwd()}/scripts/preload.ts` } },
				format: 'cjs',
				bundle: true,
				autoExternal: false,
				tools: { rspack: { target: 'electron-preload' } }
			}
		],
		output: {
			target: 'node',
			legalComments: 'none',
			cleanDistPath: false,
			filename: { js: '[name].js' }
		}
	} as RslibConfig)
})

await build().catch(err => {
	console.log(err)
})
