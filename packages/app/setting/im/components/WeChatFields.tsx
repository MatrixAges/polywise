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
					<FieldTitle className='text-base'>Bridge Base URL</FieldTitle>
					<FieldDescription>Base URL for the WeChat bridge service</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.wechat_bridge_base_url}
					onChange={event => x.updateForm('wechat_bridge_base_url', event.target.value)}
					placeholder='https://your-wechat-bridge.example.com'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Shared Secret</FieldTitle>
					<FieldDescription>Used to sign bridge callbacks and outbound requests</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[420px]'
					value={x.form.wechat_secret}
					onChange={event => x.updateForm('wechat_secret', event.target.value)}
					placeholder='shared-secret'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Send Path</FieldTitle>
					<FieldDescription>Bridge endpoint for outbound messages</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[220px]'
					value={x.form.wechat_send_path}
					onChange={event => x.updateForm('wechat_send_path', event.target.value)}
					placeholder='/send'
				/>
			</Field>
			<Field className='items-center! py-3' orientation='horizontal'>
				<FieldContent>
					<FieldTitle className='text-base'>Typing Path</FieldTitle>
					<FieldDescription>Bridge endpoint for typing notifications</FieldDescription>
				</FieldContent>
				<Input
					className='max-w-[220px]'
					value={x.form.wechat_typing_path}
					onChange={event => x.updateForm('wechat_typing_path', event.target.value)}
					placeholder='/typing'
				/>
			</Field>
		</FieldGroup>
	)
}

export default observer(Index)
