import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'

const statusVariant = (status?: 'missing' | 'installed' | 'ready' | 'warning') => {
	if (status === 'ready') return 'secondary'
	if (status === 'installed') return 'outline'
	if (status === 'warning') return 'destructive'
	return 'outline'
}

const Index = () => {
	const x = useModel()
	const status = x.wechat_clawbot_status

	return (
		<div className='flex flex-col gap-4'>
			<div
				className='
					flex flex-wrap
					items-start justify-between
					gap-3
					p-4
					rounded-2xl
					bg-muted/35
					border
				'
			>
				<div className='flex min-w-0 flex-col gap-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<div className='text-sm font-medium'>WeChat ClawBot</div>
						<Badge variant={statusVariant(status?.status)}>
							{status
								? status.status === 'ready'
									? 'Ready'
									: status.status === 'installed'
										? 'Installed'
										: status.status === 'warning'
											? 'Warning'
											: 'Not installed'
								: 'Checking'}
						</Badge>
					</div>
					<div className='text-std-500 text-sm wrap-break-word whitespace-pre-wrap'>
						{x.wechat_clawbot_loading
							? 'Checking local OpenClaw WeChat plugin status...'
							: status?.detail ||
								'Detect whether OpenClaw WeChat is installed locally before configuring the token.'}
					</div>
					{status?.install_command ? (
						<div className='text-std-400 font-mono text-xs'>{status.install_command}</div>
					) : null}
				</div>
				{status?.status === 'missing' ? (
					<Button
						type='button'
						size='sm'
						onClick={() => void x.installWechatClawbot()}
						disabled={x.wechat_clawbot_installing}
					>
						{x.wechat_clawbot_installing ? <Spinner className='size-4' /> : null}
						<span>Install</span>
					</Button>
				) : null}
			</div>

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
		</div>
	)
}

export default observer(Index)
