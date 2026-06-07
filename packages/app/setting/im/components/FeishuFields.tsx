import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Separator } from '@/__shadcn__/components/ui/separator'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')

	return (
		<FieldGroup className='gap-0'>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_connection_mode')}</FieldTitle>
					<FieldDescription>{t('im.feishu_connection_mode_desc')}</FieldDescription>
				</FieldContent>
				<div className='text-std-500 max-w-[420px] text-sm leading-6'>{t('im.feishu_sdk_desc')}</div>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_app_id')}</FieldTitle>
					<FieldDescription>{t('im.feishu_app_id_desc')}</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.feishu_app_id}
					onChange={event => x.updateForm('feishu_app_id', event.target.value)}
					placeholder='cli_xxxxxxxxxxxxx'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_app_secret')}</FieldTitle>
					<FieldDescription>{t('im.feishu_app_secret_desc')}</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.feishu_app_secret}
					onChange={event => x.updateForm('feishu_app_secret', event.target.value)}
					placeholder='App Secret'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_require_mention')}</FieldTitle>
					<FieldDescription>{t('im.feishu_require_mention_desc')}</FieldDescription>
				</FieldContent>
				<Switch
					checked={x.form.feishu_require_mention}
					onCheckedChange={value => x.updateForm('feishu_require_mention', value)}
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_allowed_group_ids')}</FieldTitle>
					<FieldDescription>{t('im.feishu_allowed_group_ids_desc')}</FieldDescription>
				</FieldContent>
				<Textarea
					className='min-h-[88px] max-w-[420px]'
					value={x.form.feishu_allowed_chat_ids}
					onChange={event => x.updateForm('feishu_allowed_chat_ids', event.target.value)}
					placeholder='oc_xxxxxxxxxxxxx'
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_allowed_user_ids')}</FieldTitle>
					<FieldDescription>{t('im.feishu_allowed_user_ids_desc')}</FieldDescription>
				</FieldContent>
				<Textarea
					className='min-h-[88px] max-w-[420px]'
					value={x.form.feishu_allowed_user_ids}
					onChange={event => x.updateForm('feishu_allowed_user_ids', event.target.value)}
					placeholder='ou_xxxxxxxxxxxxx'
				/>
			</Field>
			<Separator className='my-3 h-px w-full' />
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_verification_token')}</FieldTitle>
					<FieldDescription>{t('im.feishu_verification_token_desc')}</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.feishu_verification_token}
					onChange={event => x.updateForm('feishu_verification_token', event.target.value)}
					placeholder={t('im.feishu_verification_token')}
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_encrypt_key')}</FieldTitle>
					<FieldDescription>{t('im.feishu_encrypt_key_desc')}</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.feishu_encrypt_key}
					onChange={event => x.updateForm('feishu_encrypt_key', event.target.value)}
					placeholder={t('im.feishu_encrypt_key')}
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.feishu_webhook_callback')}</FieldTitle>
					<FieldDescription>{t('im.feishu_webhook_callback_desc')}</FieldDescription>
				</FieldContent>
				<div className='text-std-500 max-w-[420px] text-sm leading-6'>POST `/sys/im/feishu/events`</div>
			</Field>
		</FieldGroup>
	)
}

export default observer(Index)
