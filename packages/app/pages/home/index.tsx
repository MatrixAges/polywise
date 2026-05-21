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
						w-full max-w-[1180px]
						gap-4
						px-5 py-5
						mx-auto
						md:px-7
					'
				>
					{x.snapshot ? (
						<>
							<OverviewGrid></OverviewGrid>
							<TrendPanels></TrendPanels>
							<div className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
								<div className='grid gap-4'>
									<KnowledgeAssets></KnowledgeAssets>
									<RecentChanges></RecentChanges>
								</div>
								<div className='grid gap-4'>
									<MemoryPanel></MemoryPanel>
									<PthinkPanel></PthinkPanel>
								</div>
							</div>
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
