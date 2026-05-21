import { Activity, Bell, FileStack } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Link } from 'react-router'

import { useModel } from '../context'
import SectionCard from './SectionCard'

const Index = () => {
	const x = useModel()

	return (
		<SectionCard title='Recent Changes' desc='最近变动最大的交互对象，帮助用户快速回到上下文。'>
			<div className='grid gap-4 lg:grid-cols-3'>
				<div className='bg-secondary/55 rounded-3xl p-4'>
					<div
						className='
							flex
							items-center
							gap-2
							mb-3
							text-sm font-medium
						'
					>
						<Activity className='text-sky-600' />
						<span>Sessions</span>
					</div>
					<div className='flex flex-col gap-2.5'>
						{x.recent_sessions.map(item => (
							<div
								className='
									p-3
									rounded-2xl
									bg-background/80
									border border-border/60
								'
								key={item.id}
							>
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

				<div className='bg-secondary/55 rounded-3xl p-4'>
					<div
						className='
							flex
							items-center
							gap-2
							mb-3
							text-sm font-medium
						'
					>
						<FileStack className='text-emerald-600' />
						<span>Posts</span>
					</div>
					<div className='flex flex-col gap-2.5'>
						{x.recent_posts.map(item => (
							<Link
								className='
									block
									p-3
									rounded-2xl
									bg-background/80
									border border-border/60
									transition-colors
									hover:bg-background
								'
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

				<div className='bg-secondary/55 rounded-3xl p-4'>
					<div
						className='
							flex
							items-center
							gap-2
							mb-3
							text-sm font-medium
						'
					>
						<Bell className='text-amber-600' />
						<span>Notifications</span>
					</div>
					<div className='flex flex-col gap-2.5'>
						{x.recent_notifications.map(item => (
							<div
								className='
									p-3
									rounded-2xl
									bg-background/80
									border border-border/60
								'
								key={item.id}
							>
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
