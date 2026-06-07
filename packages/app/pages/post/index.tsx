import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { loadPageLocale, usePageLocale } from '@/hooks'

import { Header, List } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	usePageLocale('post')

	const ref_model = useRef<Model | null>(null)

	if (!ref_model.current) {
		ref_model.current = container.resolve(Model)
	}

	const x = ref_model.current

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	return (
		<Context value={x}>
			<div className='h-full overflow-hidden'>
				<div
					className='
						overflow-hidden
						flex flex-col
						w-full h-full
						px-6 pt-0
						page_wrap
					'
				>
					<Header></Header>
					<div className='min-h-0 flex-1 overflow-y-auto'>
						<div className='flex flex-col gap-2'>
							<List></List>
						</div>
					</div>
				</div>
			</div>
		</Context>
	)
}

export const loader = () => loadPageLocale('post')
export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
