import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import { Button } from '@/__shadcn__/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import Editor from '@/components/Editor'
import { rpc } from '@/utils'

import type { RPCInput } from '@/types'

type BookmarkForType = Extract<RPCInput['save']['for'], 'memory' | 'wiki' | 'user'>

const for_type_items: Array<{ value: BookmarkForType; label: string }> = [
	{ value: 'memory', label: 'Memory' },
	{ value: 'wiki', label: 'Wiki' },
	{ value: 'user', label: 'User' }
]

const Index = () => {
	const [for_type, setForType] = useState<BookmarkForType>('memory')
	const [content, setContent] = useState('')
	const [saving, setSaving] = useState(false)

	const clear = () => {
		setContent('')
	}

	const save = async () => {
		const trimmed = content.trim()

		if (!trimmed || saving) return

		setSaving(true)

		try {
			await rpc.save.mutate({
				content: trimmed,
				for: for_type,
				exec_pipeline: true
			})

			setContent('')
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
					gap-3
					p-2
				'
			>
				<Select value={for_type} onValueChange={value => setForType(value as BookmarkForType)}>
					<SelectTrigger className='min-w-[90px]' size='sm'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent align='start'>
						{for_type_items.map(item => (
							<SelectItem value={item.value} key={item.value}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
		</div>
	)
}

export default $app.memo(Index)
