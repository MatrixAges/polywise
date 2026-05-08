import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import DetailBody from './DetailBody'
import DetailHeader from './DetailHeader'

const Index = () => {
	const { selected_agent, current_tab } = useModel()

	if (!selected_agent) {
		return (
			<div
				className='
					flex flex-1
					items-center justify-center
					text-sm text-std-400
				'
			>
				Select an agent
			</div>
		)
	}

	const active_tab = current_tab === 'sessions' ? 'prompt' : current_tab
	const field_value =
		active_tab === 'article' ? '' : (selected_agent[active_tab] as string | null | undefined) || ''

	return (
		<div
			className='
				overflow-hidden
				flex flex-1 flex-col
			'
		>
			<div
				className='
					overflow-y-scroll
					flex flex-1 flex-col
					min-h-0
				'
			>
				<div
					className='
						flex flex-col
						w-full
					'
				>
					<DetailHeader agent={selected_agent}></DetailHeader>
					<DetailBody
						agent={selected_agent}
						active_tab={active_tab}
						field_value={field_value}
					></DetailBody>
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
