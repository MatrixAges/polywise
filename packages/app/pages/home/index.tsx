import { useEffect, useRef, useState } from 'react'
import { FileStack, History, Sparkles } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { TextTabs } from '@/components'

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

const top_tab_items = [
	{ key: 'stats', title: 'Stats', Icon: FileStack },
	{ key: 'recent', title: 'Recent', Icon: History },
	{ key: 'report', title: 'Report', Icon: Sparkles }
] as const

const Index = () => {
	const ref_model = useRef<Model | null>(null)
	const [active_tab, setActiveTab] = useState<(typeof top_tab_items)[number]['key']>('stats')

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
							<div className='flex items-center'>
								<div className='h-7'>
									<TextTabs
										className='gap-4'
										items={top_tab_items}
										active={active_tab}
										setActive={value =>
											setActiveTab(
												value as (typeof top_tab_items)[number]['key']
											)
										}
									></TextTabs>
								</div>
							</div>
							{active_tab === 'stats' ? (
								<>
									<KnowledgeAssets></KnowledgeAssets>
									<TrendPanels></TrendPanels>
									<MemoryPanel></MemoryPanel>
									<OverviewGrid></OverviewGrid>
								</>
							) : null}
							{active_tab === 'recent' ? <RecentChanges></RecentChanges> : null}
							{active_tab === 'report' ? <PthinkPanel></PthinkPanel> : null}
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
