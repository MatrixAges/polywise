import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { fromNow } from '@/utils'

import { getPostForTypeLabel, post_for_types } from '../../utils'
import { useModel } from '../context'

import type { PostForType } from '../../types'

type Props = {
	character_count: number
}

const EditorPanelFooter = ({ character_count }: Props) => {
	const x = useModel()
	const { t } = useTranslation('post')
	const for_type_labels = {
		wiki: t('tab.wiki'),
		memory: t('tab.memory'),
		user: t('tab.user'),
		linkcase: t('tab.linkcase')
	}
	const for_type_items = post_for_types.map(item => ({
		value: item,
		label: getPostForTypeLabel({ value: item, labels: for_type_labels })
	}))
	const current_for_type_label =
		for_type_items.find(item => item.value === x.draft_for_type)?.label || x.draft_for_type

	if (!x.selected_post) {
		return null
	}

	return (
		<div
			className='
				flex
				items-center justify-between
				h-7
				gap-4
				px-3
				text-std-300 text-xs
			'
		>
			<div className='flex items-center gap-3'>
				<Select
					value={x.draft_for_type}
					onValueChange={value => value && x.setDraftForType(value as PostForType)}
				>
					<SelectTrigger
						className='
							min-w-0
							gap-0
							text-xs text-std-300
							capitalize
						'
						noStyle
						noActiveStyle
					>
						<SelectValue>{current_for_type_label}</SelectValue>
					</SelectTrigger>
					<SelectContent align='start'>
						{for_type_items.map(item => (
							<SelectItem value={item.value} key={item.value}>
								<span>{item.label}</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div>{t('detail.updated', { value: fromNow(x.selected_post.updated_at) })}</div>
			</div>
			<div className='flex items-center gap-3'>
				<span>{x.dirty ? t('detail.unsaved_changes') : t('detail.saved')}</span>
				<span>{t('detail.characters', { count: character_count })}</span>
			</div>
		</div>
	)
}

export default observer(EditorPanelFooter)
