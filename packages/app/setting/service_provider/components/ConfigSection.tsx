import { SquareArrowOutUpRight } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Controller } from '@/components'

import type { AppConfig } from '@core/types'
import type { Control } from 'react-hook-form'

type ConfigSectionProps = {
	control: Control<AppConfig>
}

const Index = (props: ConfigSectionProps) => {
	const { control } = props
	const { t } = useTranslation('setting')

	return (
		<FieldGroup className='gap-0'>
			<Field className='items-center! py-3' orientation='vertical'>
				<FieldContent>
					<FieldTitle className='flex items-center text-base'>
						<span>{t('service_provider.jina_api_key')}</span>
						<a
							className='icon_button small'
							target='_blank'
							href='https://jina.ai/api-dashboard/reader'
						>
							<SquareArrowOutUpRight></SquareArrowOutUpRight>
						</a>
					</FieldTitle>
					<FieldDescription>{t('service_provider.jina_api_key_desc')}</FieldDescription>
				</FieldContent>
				<Controller type='input' name='jina_api_key' control={control}>
					<Input type='text' placeholder='jina_...' autoComplete='off' />
				</Controller>
			</Field>
			<div className='bg-border-light my-2 h-px w-full'></div>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>
						{t('service_provider.enable_webfetch_chain')}
					</FieldTitle>
					<FieldDescription>{t('service_provider.enable_webfetch_chain_desc')}</FieldDescription>
				</FieldContent>
				<Controller type='switch' name='enbale_webfetch_chain' control={control}>
					<Switch></Switch>
				</Controller>
			</Field>
		</FieldGroup>
	)
}

export default observer(Index)
