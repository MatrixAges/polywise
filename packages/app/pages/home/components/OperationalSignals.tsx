import { Activity, FolderKanban, Siren } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const card_class = 'rounded-2xl border border-border/70 p-4'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Signals'
			desc='Risk, delivery pressure, and where attention is concentrating across the active workspace.'
		>
			<div className='grid gap-6'>
				<div className='grid gap-3 md:grid-cols-5'>
					{x.signal_cards.map(item => (
						<div className={card_class} key={item.key}>
							<div className='text-std-400 text-[11px] tracking-[0.18em] uppercase'>
								{item.title}
							</div>
							<div className='mt-2 text-xl font-semibold tracking-tight'>{item.value}</div>
							{item.desc ? (
								<div className='text-std-400 mt-2 text-sm leading-5'>{item.desc}</div>
							) : null}
						</div>
					))}
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<div className={card_class}>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<FolderKanban className='text-sky-600' />
							<span>Active projects</span>
						</div>
						<div className='divide-border/60 mt-3 divide-y'>
							{x.active_projects.map(item => (
								<div className='py-3 first:pt-0 last:pb-0' key={item.id}>
									<div className='flex items-center justify-between gap-3'>
										<div className='truncate text-sm font-medium'>
											{item.name || 'Untitled project'}
										</div>
										<div className='text-std-400 shrink-0 text-xs'>
											{item.updated_label}
										</div>
									</div>
									<div className='text-std-400 mt-1 text-xs'>
										{item.message_count} messages · {item.session_count}{' '}
										sessions
									</div>
								</div>
							))}
						</div>
					</div>

					<div className={card_class}>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<Activity className='text-emerald-600' />
							<span>Hot sessions</span>
						</div>
						<div className='divide-border/60 mt-3 divide-y'>
							{x.active_sessions.map(item => (
								<div className='py-3 first:pt-0 last:pb-0' key={item.id}>
									<div className='flex items-center justify-between gap-3'>
										<div className='truncate text-sm font-medium'>
											{item.title || 'Untitled session'}
										</div>
										<div className='text-std-400 shrink-0 text-xs'>
											{item.updated_label}
										</div>
									</div>
									<div className='text-std-400 mt-1 text-xs'>
										{item.message_count} messages this week
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{x.data?.health.top_alert ? (
					<div className={card_class}>
						<div
							className='
								flex
								items-center
								gap-2
								text-sm font-medium
							'
						>
							<Siren className='text-rose-600' />
							<span>Alert detail</span>
						</div>
						<div className='mt-2 text-sm leading-6'>{x.data.health.top_alert.detail}</div>
					</div>
				) : null}
			</div>
		</SectionCard>
	)
}

export default observer(Index)
