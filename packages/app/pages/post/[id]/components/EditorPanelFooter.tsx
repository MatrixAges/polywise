import { observer } from 'mobx-react-lite'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/__shadcn__/components/ui/select'
import { fromNow } from '@/utils'

import { post_for_types } from '../../utils'
import { useModel } from '../context'

import type { PostForType } from '../../types'

type Props = {
	character_count: number
}

const EditorPanelFooter = ({ character_count }: Props) => {
	const x = useModel()

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
						<SelectValue className='capitalize' />
					</SelectTrigger>
					<SelectContent align='start'>
						{post_for_types.map(item => (
							<SelectItem value={item} key={item}>
								<span className='capitalize'>{item}</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div>Updated {fromNow(x.selected_post.updated_at)}</div>
			</div>
			<div className='flex items-center gap-3'>
				<span>{x.dirty ? 'Unsaved changes' : 'Saved'}</span>
				<span>{character_count} characters</span>
			</div>
		</div>
	)
}

export default observer(EditorPanelFooter)
