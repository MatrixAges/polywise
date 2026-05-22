import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { container } from 'tsyringe'

import { TextTabs } from '@/components'

import {
	ContentReview,
	Hotspots,
	LoadingState,
	Memory,
	Overview,
	Pipeline,
	Report,
	SessionActivity,
	TokenUsage,
	Trending
} from './components'
import { Context } from './context'
import Model from './model'

type TopTabKey = 'stats' | 'memory' | 'report'

const top_tab_items: Array<{ key: TopTabKey; title: string }> = [
	{ key: 'stats', title: 'Stats' },
	{ key: 'memory', title: 'Memory' },
	{ key: 'report', title: 'Report' }
]

const Index = () => {
	const ref_model = useRef<Model | null>(null)
	const [active_tab, setActiveTab] = useState<TopTabKey>('stats')

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
			<div className='page_wrap flex flex-col pb-10'>
				<div className='mb-6 h-7'>
					<TextTabs
						className='gap-3'
						items={top_tab_items}
						active={active_tab}
						setActive={value => setActiveTab(value as TopTabKey)}
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
										<Hotspots></Hotspots>
										<Overview></Overview>
										<TokenUsage></TokenUsage>
										<Trending></Trending>
										<SessionActivity></SessionActivity>
										<ContentReview></ContentReview>
										<Pipeline></Pipeline>
									</div>
								)}
								{active_tab === 'memory' && (
									<div className='flex flex-col gap-10'>
										<Memory></Memory>
									</div>
								)}
								{active_tab === 'report' && (
									<div className='flex flex-col gap-10'>
										<Report></Report>
									</div>
								)}
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
