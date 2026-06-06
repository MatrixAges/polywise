import { makeAutoObservable } from 'mobx'
import { toast } from 'sonner'
import { injectable } from 'tsyringe'

import Setting from '@/models/setting'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'
import type { AppConfig } from '@core/types'

type BookmarkForType = Extract<RPCInput['save']['for'], 'memory' | 'wiki' | 'user'>

@injectable()
export default class Index {
	for_type = 'wiki' as BookmarkForType
	content = ''
	saving = false

	constructor(public setting: Setting) {
		makeAutoObservable(this, { setting: false }, { autoBind: true })
	}

	get bookmark_auto_clean() {
		return Boolean(this.setting.config?.bookmark_auto_clean)
	}

	setForType(value: BookmarkForType) {
		this.for_type = value
	}

	setContent(value: string) {
		this.content = value
	}

	setBookmarkAutoClean(value: boolean) {
		return this.setting.setConfig('config', { bookmark_auto_clean: value } as AppConfig, true)
	}

	clear() {
		this.content = ''
	}

	async save() {
		const trimmed = this.content.trim()

		if (!trimmed || this.saving) return

		this.saving = true

		try {
			let title: string | undefined
			let next_content = trimmed

			if (this.bookmark_auto_clean) {
				const summary = await rpc.article.summarizeWiki.mutate({
					answer: trimmed
				})

				title = summary.title
				next_content = summary.content
			}

			await rpc.save.mutate({
				title,
				content: next_content,
				for: this.for_type,
				exec_pipeline: true
			})

			this.clear()
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save bookmark.')
		} finally {
			this.saving = false
		}
	}
}
