import { useState } from 'react'
import { ChevronDown, Eraser, LoaderCircle, Save } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { container } from 'tsyringe'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { Switch } from '@/__shadcn__/components/ui/switch'
import Editor from '@/components/Editor'

import Model from './model'

import type { RPCInput } from '@/types'

type BookmarkForType = Extract<RPCInput['save']['for'], 'memory' | 'wiki' | 'user'>

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const { t } = useTranslation()
	const for_type_items: Array<{ value: BookmarkForType; label: string }> = [
		{ value: 'wiki', label: t('bookmark_panel.for_wiki') },
		{ value: 'memory', label: t('bookmark_panel.for_memory') },
		{ value: 'user', label: t('bookmark_panel.for_user') }
	]
	const current_for_type_label = for_type_items.find(item => item.value === x.for_type)?.label || ''

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
						value={x.content}
						onChange={x.setContent}
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
						aria-label={t('bookmark_panel.auto_clean')}
						checked={x.bookmark_auto_clean}
						disabled={x.saving}
						size='sm'
						title={t('bookmark_panel.auto_clean')}
						onCheckedChange={x.setBookmarkAutoClean}
					/>
					<span className='mr-2 text-xs'>{t('bookmark_panel.auto_clean_short')}</span>
				</div>
				<div className='flex shrink-0 items-center gap-2'>
					<Select
						value={x.for_type}
						onValueChange={value => x.setForType(value as BookmarkForType)}
					>
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
							<SelectValue>{current_for_type_label}</SelectValue>
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
						disabled={x.saving || x.content.length === 0}
						title={t('bookmark_panel.clear')}
						type='button'
						onClick={x.clear}
					>
						<Eraser className='size-3.5' />
					</button>
					<button
						className='icon_button small text-std-800'
						disabled={x.saving || x.content.trim().length === 0}
						title={x.saving ? t('bookmark_panel.saving') : t('bookmark_panel.save')}
						type='button'
						onClick={() => void x.save()}
					>
						{x.saving ? (
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
