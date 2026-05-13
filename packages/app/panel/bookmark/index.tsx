import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import { Button } from '@/__shadcn__/components/ui/button'
import Editor from '@/components/Editor'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'

type BookmarkForType = Extract<RPCInput['save']['for'], 'memory' | 'wiki' | 'user'>

const for_type_items: Array<{ value: BookmarkForType; label: string; desc: string }> = [
	{ value: 'memory', label: 'Memory', desc: 'Reusable facts and notes' },
	{ value: 'wiki', label: 'Wiki', desc: 'Structured reference content' },
	{ value: 'user', label: 'User', desc: 'Personal preferences and profile' }
]

const Index = () => {
	const [for_type, setForType] = useState<BookmarkForType>('memory')
	const [content, setContent] = useState('')
	const [saving, setSaving] = useState(false)
	const [status_text, setStatusText] = useState('')

	const clear = () => {
		setContent('')
		setStatusText('')
	}

	const save = async () => {
		const trimmed = content.trim()

		if (!trimmed || saving) return

		setSaving(true)
		setStatusText('')

		try {
			await rpc.save.mutate({
				content: trimmed,
				for: for_type,
				exec_pipeline: true
			})

			setContent('')
			setStatusText(`Saved to ${for_type}. Pipeline started.`)
		} catch (error) {
			setStatusText(error instanceof Error ? error.message : 'Save failed.')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className='flex h-full min-h-0 w-full'>
			<div
				className='
					flex flex-col shrink-0
					w-34
					gap-2
					p-2
					border-r border-black/6
					dark:border-white/8
				'
			>
				<div
					className='
						px-1
						text-xs text-std-400 font-medium tracking-wide
						uppercase
					'
				>
					For Type
				</div>
				{for_type_items.map(item => {
					const active = item.value === for_type

					return (
						<button
							key={item.value}
							type='button'
							onClick={() => setForType(item.value)}
							className={`
							flex flex-col
							items-start
							w-full
							p-3
							rounded-2xl
							text-left
							border
							transition-colors
							${
								active
									? 'border-primary/30 bg-primary/8 text-std-950 dark:text-white'
									: '
							bg-white/60
							border-black/6
							hover:bg-white/90
							dark:border-white/8 dark:bg-white/4 dark:hover:bg-white/7
						'
							}
							`}
						>
							<div className='text-sm font-medium'>{item.label}</div>
							<div className='text-std-400 mt-1 text-xs'>{item.desc}</div>
						</button>
					)
				})}
			</div>
			<div className='flex min-w-0 flex-1 flex-col'>
				<div
					className='
						flex
						items-center justify-between
						gap-3
						p-2
						border-b border-black/6
						dark:border-white/8
					'
				>
					<div className='min-w-0'>
						<div className='text-sm font-medium'>Support Library Bookmark</div>
						<div className='text-std-400 text-xs'>
							Editor content will be saved with pipeline execution enabled.
						</div>
					</div>
					<div className='flex shrink-0 items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							disabled={saving || content.length === 0}
							onClick={clear}
						>
							Clear
						</Button>
						<Button
							size='sm'
							disabled={saving || content.trim().length === 0}
							onClick={() => void save()}
						>
							{saving ? <LoaderCircle className='size-4 animate-spin' /> : null}
							<span>{saving ? 'Saving' : 'Save'}</span>
						</Button>
					</div>
				</div>
				<div className='text-std-400 px-3 pt-2 text-xs'>
					{status_text || 'Write text here and save it into the selected support library.'}
				</div>
				<div className='flex min-h-0 flex-1 p-2'>
					<div
						className='
							overflow-hidden
							flex flex-1
							min-h-0
							rounded-2xl
							bg-white/80
							border border-black/6
							dark:border-white/8 dark:bg-white/4
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
			</div>
		</div>
	)
}

export default $app.memo(Index)
