import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { AccountsSection, EditorCard, PageHeader } from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
	const [x] = useState(() => container.resolve(Model))
	const editorCardRef = useRef<HTMLDivElement | null>(null)
	const accountIdInputRef = useRef<HTMLInputElement | null>(null)

	useEffect(() => {
		void x.init()

		return () => x.deinit()
	}, [x])

	useEffect(() => {
		if (!x.editorRevealKey) return

		editorCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

		const timer = window.setTimeout(() => {
			accountIdInputRef.current?.focus()
			accountIdInputRef.current?.select()
		}, 140)

		return () => window.clearTimeout(timer)
	}, [x, x.editorRevealKey])

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
					<EditorCard
						editorCardRef={editorCardRef}
						accountIdInputRef={accountIdInputRef}
					></EditorCard>
					<AccountsSection></AccountsSection>
				</div>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
