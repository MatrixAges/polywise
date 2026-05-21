import { Activity, Bell, FileStack } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const panel_class = 'rounded-2xl border border-border/70 p-4'
const item_class = 'py-3 first:pt-0 last:pb-0'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard
			title='Recent'
			desc='The shortest path back into active sessions, fresh posts, and unread notifications.'
		>
			<div className='grid gap-4 md:grid-cols-2'>
				<div className={panel_class}>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Activity className='text-sky-600' />
						<span>Sessions</span>
					</div>
					<div className='divide-border/60 mt-3 divide-y'>
						{x.recent_sessions.map(item => (
							<div className={item_class} key={item.id}>
								<div className='flex items-center justify-between gap-3'>
									<div className='truncate text-sm font-medium'>
										{item.title || 'Untitled session'}
									</div>
									<div className='text-std-400 shrink-0 text-xs'>
										{item.updated_label}
									</div>
								</div>
								<div className='text-std-400 mt-1 text-xs'>{item.status_label}</div>
							</div>
						))}
					</div>
				</div>

				<div className={panel_class}>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<FileStack className='text-emerald-600' />
						<span>Posts</span>
					</div>
					<div className='divide-border/60 mt-3 divide-y'>
						{x.recent_posts.map(item => (
							<Link
								className={`${item_class}hover:text-std-900 block transition-colors`}
								key={item.id}
								to={`/post/${item.id}`}
							>
								<div className='flex items-center justify-between gap-3'>
									<div className='truncate text-sm font-medium'>
										{item.title || 'Untitled post'}
									</div>
									<div className='text-std-400 shrink-0 text-xs'>
										{item.updated_label}
									</div>
								</div>
								<div className='text-std-400 mt-1 text-xs capitalize'>
									{item.for_type} · {item.status_label}
								</div>
							</Link>
						))}
					</div>
				</div>

				<div className={`${panel_class}md:col-span-2`}>
					<div
						className='
							flex
							items-center
							gap-2
							text-sm font-medium
						'
					>
						<Bell className='text-amber-600' />
						<span>Notifications</span>
					</div>
					<div className='divide-border/60 mt-3 divide-y'>
						{x.recent_notifications.map(item => (
							<div className={item_class} key={item.id}>
								<div className='flex items-center justify-between gap-3'>
									<div className='truncate text-sm font-medium'>{item.title}</div>
									<div className='text-std-400 shrink-0 text-xs'>
										{item.created_label}
									</div>
								</div>
								<div className='text-std-400 mt-1 text-xs'>{item.status_label}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</SectionCard>
	)
}

export default observer(Index)
