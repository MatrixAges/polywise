import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Switch } from '@/__shadcn__/components/ui/switch'

import AddModelForm from './AddModelForm'
import ModelItem from './ModelItem'

import type { ProviderCardProps } from './types'

type ConfigPanelProps = Pick<
	ProviderCardProps,
	'provider' | 'connecting_id' | 'syncing_id' | 'updating_id' | 'onToggleEnabled' | 'onSaveModels' | 'onResetModels'
>

const Index = (props: ConfigPanelProps) => {
	const { provider, connecting_id, syncing_id, updating_id, onToggleEnabled, onSaveModels, onResetModels } = props
	const { t } = useTranslation('setting')
	const [adding_model, setAddingModel] = useState(false)
	const disabled = connecting_id !== null || syncing_id !== null || updating_id !== null

	if (!provider.editable) {
		return null
	}

	return (
		<div
			className='
				flex flex-col
				gap-3
				p-3
				rounded-xl
				bg-background/60
				border border-border/60
			'
		>
			<div
				className='
					flex flex-wrap
					items-center justify-between
					gap-3
				'
			>
				<div className='flex min-w-0 flex-col gap-1'>
					<div className='text-sm font-medium'>{t('oauth_provider.model_config')}</div>
					<div
						className='
							flex flex-wrap
							items-center
							gap-2
							text-xs text-muted-foreground
						'
					>
						<Badge variant='outline'>
							{t('oauth_provider.detected_models_count', {
								count: provider.detected_model_count
							})}
						</Badge>
						<Badge variant='outline'>
							{t('oauth_provider.current_models_count', { count: provider.models.length })}
						</Badge>
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-muted-foreground text-sm'>
						{t('oauth_provider.provider_switch')}
					</span>
					<Switch
						checked={provider.enabled}
						disabled={disabled}
						onCheckedChange={checked =>
							void onToggleEnabled({ id: provider.id, enabled: checked })
						}
					/>
				</div>
			</div>
			<div className='flex flex-wrap gap-2'>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={disabled}
					onClick={() => setAddingModel(!adding_model)}
				>
					<Plus className='size-4' />
					<span>{t('oauth_provider.add_model')}</span>
				</Button>
				<Button
					type='button'
					variant='outline'
					size='sm'
					disabled={disabled || provider.detected_model_count === 0 || !provider.has_custom_models}
					onClick={() => void onResetModels(provider.id)}
				>
					<RotateCcw className='size-4' />
					<span>{t('oauth_provider.reset_models')}</span>
				</Button>
			</div>
			{adding_model ? (
				<AddModelForm
					visible={adding_model}
					disabled={disabled}
					models={provider.models}
					onCancel={() => setAddingModel(false)}
					onAdd={model => onSaveModels({ id: provider.id, models: [...provider.models, model] })}
				/>
			) : null}
			<div className='flex flex-col gap-2'>
				{provider.models.length ? (
					provider.models.map(model => (
						<ModelItem
							key={`${provider.id}-${model.id}`}
							model={model}
							disabled={disabled}
							onToggle={enabled =>
								void onSaveModels({
									id: provider.id,
									models: provider.models.map(item =>
										item.id === model.id ? { ...item, enabled } : item
									)
								})
							}
							onRemove={() =>
								void onSaveModels({
									id: provider.id,
									models: provider.models.filter(item => item.id !== model.id)
								})
							}
						/>
					))
				) : (
					<div
						className='
							px-3 py-4
							rounded-xl
							text-sm text-muted-foreground
							border border-dashed border-border/70
						'
					>
						{t('oauth_provider.no_models')}
					</div>
				)}
			</div>
		</div>
	)
}

export default Index
