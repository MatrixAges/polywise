import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import StatCard from './StatCard'

const Index = () => {
	const x = useModel()

	return (
		<div className='grid grid-cols-2'>
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
	)
}

export default observer(Index)
