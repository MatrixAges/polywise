import { X } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { fromNow } from '@/utils'

import { useModel } from '../context'

const Index = () => {
	const { archives, toggleArchive, getMoreArchives } = useModel()
	const { items = [], has_more } = archives

	return (
		<div
			className='
				flex flex-col shrink-0
				w-[320px] h-full
				bg-std-50/60
				border-l border-border-light
				dark:bg-std-50
			'
		>
			<div
				className='
					flex
					items-center justify-between
					h-8
					px-3
					border-b border-border-light
				'
			>
				<span
					className='
						px-1 py-0.5
						text-xsm text-std-500 font-medium
					'
				>
					Archives
				</span>
				<div className='mr-[-2px] flex gap-1'>
					<div className='icon_button small' onClick={toggleArchive}>
						<X></X>
					</div>
				</div>
			</div>
			<div
				className='
					overflow-y-scroll
					flex-1
					min-h-0
					px-4
				'
			>
				<div className='flex flex-col gap-3 py-3'>
					{items.map(item => (
						<div
							className={$cx(
								`
								flex flex-col
								w-full
								gap-1
								px-3 py-2
								rounded-lg
								bg-card
								border border-border-light
							`
							)}
							key={item.id}
						>
							<span className={$cx('text-std-600 text-sb leading-5.5! font-medium')}>
								{item.title}
							</span>
							<span className='text-std-400 mt-0.5 text-sm'>
								{fromNow(item.created_at)}
							</span>
						</div>
					))}
					{has_more && (
						<button className='click_button justify-center' onClick={getMoreArchives}>
							Loadmore
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default new $app.Handle(Index).by(observer).by($app.memo).get()
