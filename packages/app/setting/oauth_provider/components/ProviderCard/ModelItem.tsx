import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Switch } from '@/__shadcn__/components/ui/switch'

import type { Model } from '@core/types'

type ModelItemProps = {
	model: Model
	disabled: boolean
	onToggle: (enabled: boolean) => void
	onRemove: () => void
}

const Index = (props: ModelItemProps) => {
	const { model, disabled, onToggle, onRemove } = props
	const { t } = useTranslation('setting')

	return (
		<div
			className='
				flex
				items-center justify-between
				gap-3
				px-3 py-2
				rounded-xl
				bg-background/70
				border border-border/60
			'
		>
			<div className='flex min-w-0 flex-col gap-1'>
				<div className='text-sm font-medium wrap-break-word whitespace-pre-wrap'>{model.name}</div>
				<div className='flex flex-wrap items-center gap-2'>
					<Badge variant='outline'>{model.id}</Badge>
					{model.type ? <Badge variant='outline'>{model.type}</Badge> : null}
				</div>
			</div>
			<div className='flex shrink-0 items-center gap-3'>
				<div
					className='
						flex
						items-center
						gap-2
						text-xs text-muted-foreground
					'
				>
					<span>{t('oauth_provider.enabled')}</span>
					<Switch checked={model.enabled} disabled={disabled} onCheckedChange={onToggle} />
				</div>
				<Button type='button' variant='ghost' size='icon' disabled={disabled} onClick={onRemove}>
					<Trash2 className='size-4' />
				</Button>
			</div>
		</div>
	)
}

export default Index
