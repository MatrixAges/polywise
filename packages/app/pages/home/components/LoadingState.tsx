import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div
			className='
				p-6
				rounded-2xl
				border border-border/70
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
