import { observer } from 'mobx-react-lite'

import { useModel } from '../context'

const stat_item_class = 'flex flex-col gap-2 px-4 py-3.5'

const Index = () => {
	const x = useModel()
	const pthink_runtime_items = x.pthink_runtime_items
	const pthink_depth_items = x.pthink_depth_items

	return (
		<div className='flex flex-col gap-3'>
			<div
				className='
					flex
					items-center
					pl-2
					text-std-600 text-sm font-semibold leading-none
					border-l-2 border-std-500
				'
			>
				Report
			</div>
			<div className='text-std-400 text-sm leading-6'>
				Autonomous reporting status, schedule pressure, and runtime health.
			</div>
			<div className='flex flex-col'>
				<div className='border-border-light border px-4 py-3.5'>
					<div className='text-sm font-medium'>
						{x.pthink_enabled
							? 'Autonomous Reporting Enabled'
							: 'Autonomous Reporting Disabled'}
					</div>
					<div className='text-std-400 mt-2 text-sm leading-6'>
						Idle trigger after {x.pthink_idle_mins} minutes. Daily report{' '}
						{x.pthink_config?.daily_report_enabled
							? `on at ${x.pthink_config?.daily_report_hour ?? 21}:00`
							: 'off'}
						. Weekly report{' '}
						{x.pthink_config?.weekly_report_enabled
							? `on ${x.pthink_weekly_day} ${x.pthink_config?.weekly_report_hour ?? 20}:00`
							: 'off'}
						.
					</div>
					<div className='text-std-400 mt-2 text-sm leading-6'>{x.pthink_runtime_label}</div>
				</div>

				<div
					className='
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Top Signal</div>
					<div className='mt-2 text-sm leading-6'>{x.pthink_alert_label}</div>
				</div>

				<div
					className='
						px-4 py-3.5
						border border-border-light border-t-0
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Runtime and Config</div>
				</div>
				<div
					className='
						grid
						border border-border-light border-t-0 border-b-0
						md:grid-cols-2
					'
				>
					{pthink_runtime_items.map((item, index) => (
						<div
							className={`${stat_item_class}border-border-light border-b${
								index % 2 === 0 && index !== pthink_runtime_items.length - 1
									? 'md:border-r'
									: ''
							}`}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='text-sm leading-6'>{item.value}</div>
						</div>
					))}
				</div>

				<div
					className='
						grid
						border border-border-light border-t-0
						md:grid-cols-3
					'
				>
					{pthink_depth_items.map((item, index) => (
						<div
							className={`${stat_item_class}border-border-light border-b md:border-b-0${
								index < pthink_depth_items.length - 1 ? 'md:border-r' : ''
							}`}
							key={item.key}
						>
							<div className='text-std-400 text-xs font-medium uppercase'>{item.title}</div>
							<div className='font-mono text-2xl font-semibold tracking-tight'>
								{item.value}
							</div>
							{item.desc ? <div className='text-std-300 text-xs'>{item.desc}</div> : null}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default observer(Index)
