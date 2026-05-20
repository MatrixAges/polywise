import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { AccountsSection, EditorCard, PageHeader } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	return (
		<Context value={x}>
			<div
				className='
					overflow-y-scroll
					flex flex-col
					w-full h-full
					gap-5
					page_wrap
				'
			>
				<PageHeader></PageHeader>

				<div
					className='
						flex flex-col
						gap-5
					'
				>
					<EditorCard></EditorCard>
					<AccountsSection></AccountsSection>
				</div>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
