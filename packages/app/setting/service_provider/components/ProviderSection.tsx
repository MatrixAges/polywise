import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
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
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	return (
		<FieldGroup className='gap-0'>
			<div className='flex items-start justify-between py-3'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('service_provider.providers_title')}</FieldTitle>
					<FieldDescription>{t('service_provider.providers_desc')}</FieldDescription>
				</FieldContent>
				<Button
					type='button'
					variant='outline'
					size='sm'
					onClick={() => void x.refreshProviders(true)}
					disabled={x.loading}
				>
					{x.loading ? <Spinner className='size-4' /> : <RefreshCw className='size-4' />}
					<span>{t('service_provider.refresh')}</span>
				</Button>
			</div>
			<DndContext sensors={sensors} onDragEnd={x.handleProviderDragEnd}>
				<SortableContext
					items={x.providers.map(provider => provider.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className='mb-2 flex flex-col gap-2'>
						{x.providers.map(provider => (
							<ProviderCard
								key={provider.id}
								provider={provider}
								drag_disabled={x.drag_disabled}
								installing_id={x.installing_id}
								managing_action_id={x.managing_action_id}
								onInstall={x.installProvider}
								onManage={x.manageProvider}
							></ProviderCard>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</FieldGroup>
	)
}

export default observer(Index)
