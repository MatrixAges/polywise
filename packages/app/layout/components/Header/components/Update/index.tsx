import { ArrowUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Tooltip } from '@/components'
import { is_electron } from '@/utils'

import ProgressRing from './ProgressRing'

import styles from './index.module.css'

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
				<div className='icon_button mr-1 h-6 w-6'>
					<ProgressRing percent={percent}></ProgressRing>
				</div>
			</Tooltip>
		)
	}

	return (
		<Tooltip title={t('app_update.available_tooltip', { version: update_status.version })} className='no_drag'>
			<button
				className='
					relative
					overflow-hidden
					flex
					items-center justify-center
					w-6 h-6
					mr-1
					hover:bg-std-100/30!
					icon_button active no_drag
				'
				onClick={downloadUpdate}
			>
				<span className={styles.viewport}>
					<span className={styles.track}>
						<ArrowUp className={styles.arrow} aria-hidden='true'></ArrowUp>
						<ArrowUp className={styles.arrow} aria-hidden='true'></ArrowUp>
					</span>
				</span>
			</button>
		</Tooltip>
	)
}

export default $app.memo(Index)
