import fs from 'fs-extra'

import { codex_models_cache_path } from './constants'

import type { Model } from '@core/types'

interface CodexCachedModel {
	slug?: string
	display_name?: string
	supported_in_api?: boolean
	visibility?: string
}

interface CodexModelsCacheFile {
	models?: Array<CodexCachedModel>
}

const getString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export default async () => {
	const cache_file = (await fs.readJson(codex_models_cache_path).catch(() => null)) as CodexModelsCacheFile | null
	const models = cache_file?.models ?? []

	return models
		.filter(item => item?.supported_in_api === true)
		.filter(item => getString(item?.visibility) !== 'hide')
		.map(item => {
			const id = getString(item?.slug)
			const name = getString(item?.display_name) || id

			return {
				id,
				name,
				enabled: true
			} satisfies Model
		})
		.filter(item => item.id)
}
