import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import EntityAvatar from '@/setting/im/components/EntityAvatar'

import { useModel } from '../context'

import type { HomeLeaderboardItem } from '../types'

const section_title_class =
	'flex items-center pl-2 text-std-600 text-sm font-semibold leading-none border-l-2 border-std-500'

const Leaderboard = (props: { title: string; items: Array<HomeLeaderboardItem> }) => {
	const { t } = useTranslation('home')

	return (
		<div className='flex flex-col gap-3'>
			<div className={section_title_class}>{props.title}</div>
			<div className='border-border-light flex flex-col border'>
				{props.items.length ? (
					props.items.map((item, index) => (
						<div
							className={$cx(
								`
								flex
								items-start justify-between
								gap-3
								px-4 py-3.5
							`,
								index !== props.items.length - 1 && 'border-border-light border-b'
							)}
							key={item.key}
						>
							<div
								className='
									flex flex-1
									items-start
									min-w-0
									gap-3
								'
							>
								<EntityAvatar
									name={item.title}
									photo={item.photo ?? null}
									avatar={item.avatar}
									size={36}
								/>
								<div className='min-w-0 flex-1'>
									<div className='mb-2 truncate text-sm font-medium'>
										{item.title}
									</div>
									<div className='text-std-300 mt-0.5 truncate text-xs'>
										{item.subtitle}
									</div>
									<div className='text-std-300 mt-1 truncate text-xs'>
										{item.meta}
									</div>
									<div className='text-std-300 mt-1 text-xs'>{item.footnote}</div>
								</div>
							</div>
							<div className='shrink-0 text-right'>
								<div className='font-mono text-sm font-semibold'>{item.value}</div>
								<div className='text-std-300 text-xs'>{t('common.tokens')}</div>
							</div>
						</div>
					))
				) : (
					<div className='text-std-300 px-4 py-5 text-sm'>{t('common.no_data')}</div>
				)}
			</div>
		</div>
	)
}

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('home')

	return (
		<div className='flex flex-col gap-10'>
			<div className='flex flex-col gap-3'>
				<div className={section_title_class}>{t('sections.agent')}</div>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-b-0
					'
				>
					{x.agent_overview_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-b border-border-light
								even:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							<div className='text-std-300 text-xs'>{item.desc}</div>
						</div>
					))}
				</div>
			</div>
			<div className='flex flex-col gap-3'>
				<div className={section_title_class}>{t('sections.activity_surface')}</div>
				<div
					className='
						grid grid-cols-2
						border border-border-light border-b-0
					'
				>
					{x.agent_activity_items.map(item => (
						<div
							className='
								flex flex-col
								gap-2
								px-4 py-3.5
								border-r border-b border-border-light
								even:border-r-0
							'
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							<div className='text-std-300 text-xs'>{item.desc}</div>
						</div>
					))}
				</div>
			</div>
			<Leaderboard items={x.top_agent_items} title={t('sections.top_agents')} />
			<Leaderboard items={x.top_group_items} title={t('sections.top_groups')} />
		</div>
	)
}

export default observer(Index)
