import { deepmerge } from 'deepmerge-ts'

import { build } from '@rslib/core'

import { rslib } from '../../../config'

import type { RslibConfig } from '@rslib/core'

build(
	deepmerge(rslib, {
		lib: [
			{
				source: { entry: { preload: `${process.cwd()}/scripts/preload.ts` } },
				format: 'cjs',
				bundle: true,
				autoExternal: false,
				tools: { rspack: { target: 'electron-preload' } }
			},
			{
				source: { entry: { notarize: `${process.cwd()}/scripts/notarize.ts` } },
				externals: ['@electron/notarize', 'electron-builder'],
				format: 'cjs'
			}
		],
		output: {
			target: 'node',
			legalComments: 'none',
			cleanDistPath: false,
			filename: { js: '[name].js' }
		}
	} as RslibConfig)
).catch(err => {
	console.log(err)
})
