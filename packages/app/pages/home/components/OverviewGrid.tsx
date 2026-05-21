import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import StatCard from './StatCard'

const Index = () => {
	const x = useModel()

	return (
		<section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
			{x.overview_cards.map(item => (
				<StatCard
					key={item.key}
					title={item.title}
					value={item.value}
					desc={item.desc}
					tone_key={item.key}
				/>
			))}
		</section>
	)
}

export default observer(Index)
