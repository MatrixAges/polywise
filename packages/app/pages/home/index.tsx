import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { TextTabs } from '@/components'

import {
	ActivityHotspots,
	ContentReview,
	LoadingState,
	MemoryPanel,
	OverviewGrid,
	Pipeline,
	PthinkPanel,
	SessionActivity,
	TokenUsage,
	Trending
} from './components'
import { Context } from './context'
import Model from './model'

import type { LucideIcon } from 'lucide-react'

const top_tab_items = [
	{ key: 'stats', title: 'Stats' },
	{ key: 'report', title: 'Report' }
] as Array<{ key: string; title: string; Icon: LucideIcon }>

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
			<div className='page_wrap flex flex-col'>
				<div className='mb-6 h-7'>
					<TextTabs
						className='gap-3'
						items={top_tab_items}
						active={active_tab}
						setActive={value => setActiveTab(value as (typeof top_tab_items)[number]['key'])}
					></TextTabs>
				</div>
				<div className='min-h-0 flex-1 overflow-y-auto'>
					<div
						className='
							flex flex-col
							w-full
							min-h-full
						'
					>
						{x.snapshot ? (
							<>
								{active_tab === 'stats' && (
									<div className='flex flex-col gap-10'>
										{/* <ActivityHotspots></ActivityHotspots> */}
										<TokenUsage></TokenUsage>
										<Trending></Trending>
										<SessionActivity></SessionActivity>
										<ContentReview></ContentReview>
										<Pipeline></Pipeline>

										<MemoryPanel></MemoryPanel>
										<OverviewGrid></OverviewGrid>
									</div>
								)}
								{active_tab === 'report' && <PthinkPanel></PthinkPanel>}
							</>
						) : (
							<LoadingState></LoadingState>
						)}
					</div>
				</div>
			</div>
		</Context>
	)
}

export const Component = new $app.Handle(Index).by(observer).by($app.memo).get()
