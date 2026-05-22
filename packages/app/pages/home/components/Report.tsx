import { FileStack, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { MessageResponse } from '@/__shadcn__/components/ai-elements/message'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<div className='flex flex-col gap-4'>
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
				File-based reporting with incremental updates stored under `app_dir/report`.
			</div>
			<div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_320px]'>
				<div
					className='
						min-w-0
						px-4 py-4
						border border-border-light
					'
				>
					<div className='text-std-400 text-xs font-medium uppercase'>Selected Window</div>
					<div className='mt-2 text-base font-medium'>{x.report_window_label}</div>
					<div className='text-std-400 mt-1 text-sm'>Updated {x.report_updated_label}</div>
					{x.report_loading ? (
						<div
							className='
								flex
								items-center
								gap-2
								mt-6
								text-std-400 text-sm
							'
						>
							<Loader2 className='size-4 animate-spin'></Loader2>
							Loading report content...
						</div>
					) : x.report_error ? (
						<div className='text-std-400 mt-6 text-sm'>{x.report_error}</div>
					) : x.report_exists && x.report_content ? (
						<div className='mt-6 pt-1' data-streamdown>
							<MessageResponse className='w-full leading-7'>
								{x.report_content}
							</MessageResponse>
						</div>
					) : (
						<div className='text-std-400 mt-6 text-sm leading-6'>
							No report generated for this window yet. Use the `Report` button in the header
							to generate one in the background.
						</div>
					)}
				</div>
				<div className='flex flex-col gap-3'>
					<div className='border-border-light border px-4 py-3.5'>
						<div className='text-std-400 text-xs font-medium uppercase'>Runtime Status</div>
						<div className='mt-2 text-sm font-medium'>{x.report_action_label}</div>
						<div className='text-std-400 mt-2 text-sm leading-6'>{x.report_status_detail}</div>
					</div>
					<div className='border-border-light border px-4 py-3.5'>
						<div className='text-std-400 text-xs font-medium uppercase'>Storage</div>
						<div
							className='
								flex
								items-start
								gap-2
								mt-2
								text-sm leading-6
							'
						>
							<FileStack className='text-std-300 mt-0.5 size-4 shrink-0'></FileStack>
							<div className='min-w-0 break-all'>
								{x.report_path || 'app_dir/report/<window>.md'}
							</div>
						</div>
					</div>
					{x.report_plan_path ? (
						<div className='border-border-light border px-4 py-3.5'>
							<div className='text-std-400 text-xs font-medium uppercase'>
								Temporary Plan
							</div>
							<div className='mt-2 text-sm leading-6 break-all'>{x.report_plan_path}</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}

export default observer(Index)
