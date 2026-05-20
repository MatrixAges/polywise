import { observer } from 'mobx-react-lite'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<FieldGroup className='gap-0'>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Connection Mode</FieldTitle>
					<FieldDescription>
						Polywise uses Feishu long connection mode by default. No public callback URL is
						required.
					</FieldDescription>
				</FieldContent>
				<div className='text-std-500 max-w-[420px] text-sm leading-6'>
					Install the optional SDK on the local Polywise machine:
					<div
						className='
							px-3 py-2
							mt-2
							rounded-md
							text-xs font-mono
							border
						'
					>
						pnpm --filter polywise add @larksuiteoapi/node-sdk
					</div>
				</div>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>App ID</FieldTitle>
					<FieldDescription>Feishu self-built app App ID</FieldDescription>
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
					<FieldTitle className='text-base'>App Secret</FieldTitle>
					<FieldDescription>Feishu self-built app App Secret</FieldDescription>
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
					<FieldTitle className='text-base'>Verification Token</FieldTitle>
					<FieldDescription>
						Optional. Only used when you enable webhook callback mode instead of long
						connection.
					</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.feishu_verification_token}
					onChange={event => x.updateForm('feishu_verification_token', event.target.value)}
					placeholder='Verification Token'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Encrypt Key</FieldTitle>
					<FieldDescription>
						Optional. Only used when Feishu webhook encryption is enabled.
					</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.feishu_encrypt_key}
					onChange={event => x.updateForm('feishu_encrypt_key', event.target.value)}
					placeholder='Encrypt Key (optional)'
				/>
			</Field>
			<Field className='items-start! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Webhook Callback</FieldTitle>
					<FieldDescription>
						Optional webhook fallback only. You do not need this for the default long connection
						mode.
					</FieldDescription>
				</FieldContent>
				<div className='text-std-500 max-w-[420px] text-sm leading-6'>POST `/sys/im/feishu/events`</div>
			</Field>
		</FieldGroup>
	)
}

export default observer(Index)
