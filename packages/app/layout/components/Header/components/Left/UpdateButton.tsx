import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Tooltip } from '@/components'
import { is_electron } from '@/utils'

import ProgressRing from './ProgressRing'

import type { UpdateState } from '@/types/app'

interface IProps {
	update_status: UpdateState
	downloadUpdate: () => void
}

const Index = (props: IProps) => {
	const { update_status, downloadUpdate } = props
	const { t } = useTranslation()

	if (!is_electron) {
		return null
	}

	if (!update_status || update_status.type === 'error') {
		return null
	}

	if (update_status.type === 'downloading' || update_status.type === 'downloaded') {
		const percent = update_status.type === 'downloading' ? update_status.percent : 100
		const title =
			update_status.type === 'downloading'
				? t('app_update.downloading_tooltip', { percent })
				: t('app_update.restarting')

		return (
			<Tooltip title={title} className='no_drag'>
				<div
					className='
						flex
						items-center justify-center
						w-7 h-7
						ml-1
					'
				>
					<ProgressRing percent={percent}></ProgressRing>
				</div>
			</Tooltip>
		)
	}

	return (
		<Tooltip title={t('app_update.available_tooltip', { version: update_status.version })} className='no_drag'>
			<button
				className='
					ml-1
					text-emerald-500/80
					hover:bg-emerald-500/10 hover:text-emerald-500
					icon_button no_drag
				'
				onClick={downloadUpdate}
			>
				<ArrowUp></ArrowUp>
			</button>
		</Tooltip>
	)
}

export default $app.memo(Index)
