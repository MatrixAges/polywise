import { RefreshCw } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Button } from '@/__shadcn__/components/ui/button'
import { FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'
import ProviderCard from './ProviderCard'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')

	return (
		<FieldGroup className='gap-0'>
			<div className='flex items-start justify-between py-3'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('oauth_provider.title')}</FieldTitle>
					<FieldDescription>{t('oauth_provider.desc')}</FieldDescription>
				</FieldContent>
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={() => void x.refreshProviders()}
					disabled={x.loading || x.busy}
				>
					{x.loading ? <Spinner className='size-4' /> : <RefreshCw className='size-4' />}
					<span>{t('oauth_provider.refresh')}</span>
				</Button>
			</div>
			<div className='mb-2 flex flex-col gap-2'>
				{x.providers.map(provider => (
					<ProviderCard
						key={provider.id}
						provider={provider}
						connecting_id={x.connecting_id}
						syncing_id={x.syncing_id}
						updating_id={x.updating_id}
						onConnect={x.connectProvider}
						onSync={x.syncProvider}
						onToggleEnabled={x.setProviderEnabled}
						onSaveModels={x.saveProviderModels}
						onResetModels={x.resetProviderModels}
					></ProviderCard>
				))}
			</div>
		</FieldGroup>
	)
}

export default observer(Index)
