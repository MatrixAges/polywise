import { useState } from 'react'
import { ChevronDown, Eraser, LoaderCircle, Save } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { Switch } from '@/__shadcn__/components/ui/switch'
import Editor from '@/components/Editor'
import { useGlobal } from '@/context'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'
import type { AppConfig } from '@core/types'

type BookmarkForType = Extract<RPCInput['save']['for'], 'memory' | 'wiki' | 'user'>

const for_type_items: Array<{ value: BookmarkForType; label: string }> = [
	{ value: 'wiki', label: 'Wiki' },
	{ value: 'memory', label: 'Memory' },
	{ value: 'user', label: 'User' }
]

const Index = () => {
	const global = useGlobal()
	const s = global.setting
	const [for_type, setForType] = useState<BookmarkForType>('memory')
	const [content, setContent] = useState('')
	const [saving, setSaving] = useState(false)
	const bookmark_auto_clean = Boolean(s.config?.bookmark_auto_clean)

	const clear = () => {
		setContent('')
	}

	const save = async () => {
		const trimmed = content.trim()

		if (!trimmed || saving) return

		setSaving(true)

		try {
			let title: string | undefined
			let next_content = trimmed

			if (bookmark_auto_clean) {
				const summary = await rpc.article.summarizeWiki.mutate({
					answer: trimmed
				})

				title = summary.title
				next_content = summary.content
			}

			await rpc.save.mutate({
				title,
				content: next_content,
				for: for_type,
				exec_pipeline: true
			})

			setContent('')
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save bookmark.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div
			className='
				flex flex-col
				w-full h-full
			'
		>
			<div
				className='
					overflow-y-scroll
					flex flex-1
					w-full
					min-h-0
					p-2
				'
			>
				<div
					className='
						w-full
						rounded-2xl
					'
				>
					<Editor
						id='panel-bookmark-editor'
						className='px-4 pt-4 pb-8'
						value={content}
						onChange={setContent}
					></Editor>
				</div>
			</div>
			<div
				className='
					flex
					items-center justify-between
					h-9
					gap-3
					px-2
					text-xsm text-std-400
					border-t border-border-light
				'
			>
				<div className='flex min-w-0 items-center'>
					<Switch
						className='mr-1'
						aria-label='Auto clean bookmark before save'
						checked={bookmark_auto_clean}
						disabled={saving}
						size='sm'
						title='Auto clean bookmark before save'
						onCheckedChange={checked =>
							s.setConfig('config', { bookmark_auto_clean: checked } as AppConfig, true)
						}
					/>
					<span className='mr-2 text-xs'>Auto Clean</span>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					<Select value={for_type} onValueChange={value => setForType(value as BookmarkForType)}>
						<SelectTrigger
							className='
								flex
								items-center
								w-auto h-6
								gap-1
								p-0
								text-xsm text-std-400
								bg-transparent
								hover:text-foreground
								[&_svg]:shrink-0
							'
							noStyle
							noActiveStyle
						>
							<SelectValue />
							<ChevronDown className='size-3' />
						</SelectTrigger>
						<SelectContent align='start'>
							{for_type_items.map(item => (
								<SelectItem value={item.value} key={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<button
						className='icon_button small text-std-800'
						disabled={saving || content.length === 0}
						title='Clear'
						type='button'
						onClick={clear}
					>
						<Eraser className='size-3.5' />
					</button>
					<button
						className='icon_button small text-std-800'
						disabled={saving || content.trim().length === 0}
						title={saving ? 'Saving' : 'Save'}
						type='button'
						onClick={() => void save()}
					>
						{saving ? (
							<LoaderCircle className='size-3.5 animate-spin' />
						) : (
							<Save className='size-3.5' />
						)}
					</button>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
