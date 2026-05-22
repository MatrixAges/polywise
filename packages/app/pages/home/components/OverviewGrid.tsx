import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'
import StatCard from './StatCard'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Overview'
			desc='Week-first workspace signals, with total accumulation kept visible as supporting context.'
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
