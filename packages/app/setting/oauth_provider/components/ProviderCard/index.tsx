import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import ConfigPanel from './ConfigPanel'
import Header from './Header'
import { getDetail } from './helpers'

import type { ProviderCardProps } from './types'

const Index = (props: ProviderCardProps) => {
	const { provider } = props
	const { t } = useTranslation('setting')

	return (
		<div
			className='
				flex flex-col
				gap-3
				px-4 py-3
				rounded-2xl
				bg-muted/40
			'
		>
			<Header {...props} />
			<div
				className='
					flex flex-col
					min-w-0
					gap-2
					p-3
					rounded-xl
					bg-background/70
					border border-border/60
				'
			>
				<div className='text-sm font-medium'>{t('oauth_provider.detected_via')}</div>
				<div className='text-std-500 text-sm wrap-break-word whitespace-pre-wrap'>
					{getDetail({ provider, t })}
				</div>
			</div>
			<ConfigPanel {...props} />
		</div>
	)
}

export default observer(Index)
