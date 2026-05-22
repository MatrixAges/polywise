import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div className='flex flex-col gap-3'>
			<div
				className='
					flex
					items-center
					pl-2
					text-std-600 text-sm font-semibold leading-none
					border-l-2 border-std-500
				'
			>
				Content Review
			</div>
			<div className='border-border-light grid grid-cols-2 border'>
				<div
					className='
						flex flex-col
						gap-2
						px-4 py-3.5
						border-border-light border-r
						last:border-r-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Links</div>
					<div className='font-mono text-2xl font-semibold tracking-tight'>{x.linkcase_total}</div>
					<div className='text-std-300 text-xs'>{x.linkcase_meta}</div>
				</div>
				<div
					className='
						flex flex-col
						gap-2
						px-4 py-3.5
						border-border-light border-r
						last:border-r-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Posts</div>
					<div className='font-mono text-2xl font-semibold tracking-tight'>{x.posts_total}</div>
					<div className='text-std-300 text-xs'>{x.posts_meta}</div>
				</div>
			</div>
		</div>
	)
}

export default observer(Index)
