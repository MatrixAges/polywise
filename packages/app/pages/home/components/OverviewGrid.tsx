import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'
import StatCard from './StatCard'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Overview'
			desc='Eight operational signals for the current workspace, kept dense enough to scan in a few seconds.'
		>
			<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
				{x.overview_cards.map(item => (
					<StatCard
						key={item.key}
						title={item.title}
						value={item.value}
						desc={item.desc}
						tone_key={item.key}
					/>
				))}
			</div>
		</SectionCard>
	)
}

export default observer(Index)
