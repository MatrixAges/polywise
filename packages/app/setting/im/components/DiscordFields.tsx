import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')

	return (
		<FieldGroup className='gap-0'>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.discord_bot_token')}</FieldTitle>
					<FieldDescription>{t('im.discord_bot_token_desc')}</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.discord_token}
					onChange={event => x.updateForm('discord_token', event.target.value)}
					placeholder='DISCORD_BOT_TOKEN'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.discord_require_mention')}</FieldTitle>
					<FieldDescription>{t('im.discord_require_mention_desc')}</FieldDescription>
				</FieldContent>
				<Switch
					checked={x.form.discord_require_mention}
					onCheckedChange={value => x.updateForm('discord_require_mention', value)}
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.discord_allowed_guild_ids')}</FieldTitle>
					<FieldDescription>{t('im.discord_allowed_common_desc')}</FieldDescription>
				</FieldContent>
				<Textarea
					className='min-h-[88px] max-w-[420px]'
					value={x.form.discord_allowed_guild_ids}
					onChange={event => x.updateForm('discord_allowed_guild_ids', event.target.value)}
					placeholder='123456789012345678'
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.discord_allowed_channel_ids')}</FieldTitle>
					<FieldDescription>{t('im.discord_allowed_common_desc')}</FieldDescription>
				</FieldContent>
				<Textarea
					className='min-h-[88px] max-w-[420px]'
					value={x.form.discord_allowed_channel_ids}
					onChange={event => x.updateForm('discord_allowed_channel_ids', event.target.value)}
					placeholder='223456789012345678'
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>{t('im.discord_allowed_user_ids')}</FieldTitle>
					<FieldDescription>{t('im.discord_allowed_common_desc')}</FieldDescription>
				</FieldContent>
				<Textarea
					className='min-h-[88px] max-w-[420px]'
					value={x.form.discord_allowed_user_ids}
					onChange={event => x.updateForm('discord_allowed_user_ids', event.target.value)}
					placeholder='323456789012345678'
				/>
			</Field>
		</FieldGroup>
	)
}

export default observer(Index)
