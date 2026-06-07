import { FileStack, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { MessageResponse } from '@/__shadcn__/components/ai-elements/message'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('home')

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
				{t('sections.report')}
			</div>
			<div className='flex flex-col gap-3'>
				<div className='flex flex-col gap-3'>
					<div className='border-border-light border px-4 py-3.5'>
						<div className='flex items-center justify-between text-xs'>
							<div className='text-std-400 font-medium uppercase'>
								{t('report.runtime_status')}
							</div>
							<div className='font-medium'>{x.report_action_label}</div>
						</div>
						<div className='text-std-400 mt-2 text-sm leading-6'>{x.report_status_detail}</div>
					</div>
				</div>
				<div
					className='
						min-w-0
						px-4 py-4
						border border-border-light
					'
				>
					<div className='mt-2 text-base font-medium'>{x.report_window_label}</div>
					<div className='text-std-400 mt-1 text-sm'>
						{t('report.updated', { value: x.report_updated_label })}
					</div>
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
							{t('report.loading')}
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
						<div className='text-std-400 mt-6 text-sm leading-6'>{t('report.empty')}</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default observer(Index)
