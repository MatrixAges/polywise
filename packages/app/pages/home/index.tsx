import { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import {
	KnowledgeAssets,
	LoadingState,
	MemoryPanel,
	OverviewGrid,
	PthinkPanel,
	RecentChanges,
	TrendPanels
} from './components'
import { Context } from './context'
import Model from './model'

const Index = () => {
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
			<div className='h-full overflow-y-auto'>
				<div
					className='
						flex flex-col
						w-full
						min-h-full
						gap-10
						py-6
						md:py-8
						page_wrap
					'
				>
					{x.snapshot ? (
						<>
							<KnowledgeAssets></KnowledgeAssets>
							<TrendPanels></TrendPanels>
							<RecentChanges></RecentChanges>
							<MemoryPanel></MemoryPanel>
							<PthinkPanel></PthinkPanel>
							<OverviewGrid></OverviewGrid>
						</>
					) : (
						<LoadingState></LoadingState>
					)}
				</div>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
