import { observer } from 'mobx-react-lite'

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'

import { useModel } from '../context'

const Index = () => {
	const x = useModel()

	return (
		<FieldGroup className='gap-0'>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>ClawBot Token</FieldTitle>
					<FieldDescription>
						Bot token from the WeChat ClawBot / iLink channel configuration
					</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.wechat_bot_token}
					onChange={event => x.updateForm('wechat_bot_token', event.target.value)}
					placeholder='ILINK_BOT_TOKEN'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>API Base URL</FieldTitle>
					<FieldDescription>
						Default ClawBot API base. Only change this if your channel exposes a custom
						endpoint.
					</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.wechat_api_base_url}
					onChange={event => x.updateForm('wechat_api_base_url', event.target.value)}
					placeholder='https://ilinkai.weixin.qq.com/ilink/bot/'
				/>
			</Field>
		</FieldGroup>
	)
}

export default observer(Index)
