import {
	Archive,
	BookMarked,
	CalendarClock,
	CircleCheck,
	CircleCheckBig,
	CircleDashed,
	CircleDot,
	CircleQuestionMark,
	CircleX,
	Files,
	Loader,
	Rss,
	ShieldBan
} from 'lucide-react'

import type { Context } from '@core/fst'
import type { LucideIcon } from 'lucide-react'

const task_status_icon_map = {
	draft: {
		Icon: CircleDashed,
		color: 'text-std-300'
	},
	pending: {
		Icon: CircleDot,
		color: 'text-std-600'
	},
	processing: {
		Icon: Loader,
		color: 'text-std-black'
	},
	done: {
		Icon: CircleCheck,
		color: 'text-green-500'
	},
	error: {
		Icon: CircleX,
		color: 'text-red-500'
	},
	archive: {
		Icon: Archive,
		color: 'text-teal-500'
	}
} as Record<string, { Icon: LucideIcon; color: string }>

const Index = (props: Context) => {
	const { intent, context, tasks, files, constraints, learned, blockers } = props || {}

	console.log(tasks)

	return (
		<div
			className='
				flex flex-col
				gap-6
				pb-5
				text-sm
			'
		>
			{intent && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='flex items-center gap-1'>
						<CircleQuestionMark size={12}></CircleQuestionMark>
						<span className='font-medium'>Intent</span>
					</div>
					<span className='text-std-500'>{intent}</span>
				</div>
			)}
			{context && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='flex items-center gap-1'>
						<Rss size={12}></Rss>
						<span className='font-medium'>Context</span>
					</div>
					<span className='text-std-500'>{context}</span>
				</div>
			)}
			{tasks && tasks?.length > 0 && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='mb-0.5 flex items-center gap-1'>
						<CircleCheckBig size={12}></CircleCheckBig>
						<span className='font-medium'>Tasks</span>
					</div>
					<div className='flex flex-col gap-2'>
						{tasks.map((item, index) => {
							const { Icon, color } = task_status_icon_map[item.status]

							return (
								<div
									className='
									flex flex-col
									gap-1
									px-3 py-2
									rounded-lg
									border border-border-light
								'
									key={index}
								>
									<div className='flex items-center justify-between'>
										<span className='font-medium'>{item.title}</span>
										<Icon className={color} size={12}></Icon>
									</div>
									<span className='text-std-500'>{item.desc}</span>
								</div>
							)
						})}
					</div>
				</div>
			)}
			{files && files?.length > 0 && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='mb-0.5 flex items-center gap-1'>
						<Files size={12}></Files>
						<span className='font-medium'>Files</span>
					</div>
					<div className='flex flex-col gap-2'>
						{files.map((item, index) => (
							<div
								className='
									flex flex-col
									gap-1
									px-3 py-2
									rounded-lg
									border border-border-light
								'
								key={index}
							>
								<div className='flex items-center justify-between'>
									<span className='font-medium'>{item.path}</span>
								</div>
								<span className='text-std-500'>{item.desc}</span>
							</div>
						))}
					</div>
				</div>
			)}
			{constraints && constraints?.length > 0 && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='mb-0.5 flex items-center gap-1'>
						<ShieldBan size={12}></ShieldBan>
						<span className='font-medium'>Constraints</span>
					</div>
					<div
						className='
							flex flex-col
							gap-1
							px-3 py-2
							pl-6
							rounded-lg
							border border-border-light
						'
					>
						{constraints.map((item, index) => (
							<ul className='list-disc' key={index}>
								<li>{item}</li>
							</ul>
						))}
					</div>
				</div>
			)}
			{learned && learned?.length > 0 && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='mb-0.5 flex items-center gap-1'>
						<BookMarked size={12}></BookMarked>
						<span className='font-medium'>Learned</span>
					</div>
					<div
						className='
							flex flex-col
							gap-1
							px-3 py-2
							pl-6
							rounded-lg
							border border-border-light
						'
					>
						{learned.map((item, index) => (
							<ul className='list-disc' key={index}>
								<li>{item}</li>
							</ul>
						))}
					</div>
				</div>
			)}
			{blockers && blockers?.length > 0 && (
				<div
					className='
						flex flex-col
						gap-1.5
					'
				>
					<div className='mb-0.5 flex items-center gap-1'>
						<CalendarClock size={12}></CalendarClock>
						<span className='font-medium'>Constraints</span>
					</div>
					<div
						className='
							flex flex-col
							gap-1
							px-3 py-2
							pl-6
							rounded-lg
							border border-border-light
						'
					>
						{blockers.map((item, index) => (
							<ul className='list-disc' key={index}>
								<li>{item}</li>
							</ul>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default $app.memo(Index)
