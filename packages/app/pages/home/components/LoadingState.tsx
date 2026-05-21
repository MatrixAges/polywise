import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				p-6
				rounded-[32px]
				bg-background/80
				border border-border/70
				shadow-sm
			'
		>
			<div className='text-lg font-semibold'>Home</div>
			<div className='text-std-400 mt-2 text-sm'>
				{x.loading ? 'Loading workspace snapshot...' : 'No homepage snapshot yet.'}
			</div>
		</div>
	)
}

export default observer(Index)
