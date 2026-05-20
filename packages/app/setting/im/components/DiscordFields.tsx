import { observer } from 'mobx-react-lite'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Switch } from '@/__shadcn__/components/ui/switch'
import { Textarea } from '@/__shadcn__/components/ui/textarea'

import { useModel } from '../context'

const DiscordFields = () => {
	const x = useModel()

	return (
		<FieldGroup className='gap-0'>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Bot Token</FieldTitle>
					<FieldDescription>Discord bot token for gateway and API access</FieldDescription>
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
					<FieldTitle className='text-base'>Require Mention</FieldTitle>
					<FieldDescription>
						Only respond in guild channels when mentioned or replied to
					</FieldDescription>
				</FieldContent>
				<Switch
					checked={x.form.discord_require_mention}
					onCheckedChange={value => x.updateForm('discord_require_mention', value)}
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Allowed Guild IDs</FieldTitle>
					<FieldDescription>One per line or comma-separated. Leave empty for all.</FieldDescription>
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
					<FieldTitle className='text-base'>Allowed Channel IDs</FieldTitle>
					<FieldDescription>One per line or comma-separated. Leave empty for all.</FieldDescription>
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
					<FieldTitle className='text-base'>Allowed User IDs</FieldTitle>
					<FieldDescription>One per line or comma-separated. Leave empty for all.</FieldDescription>
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

export default observer(DiscordFields)
