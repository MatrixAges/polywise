import { CheckCircle2, LoaderCircle, QrCode, ShieldEllipsis } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { Badge } from '@/__shadcn__/components/ui/badge'
import { Button } from '@/__shadcn__/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/__shadcn__/components/ui/dialog'
import { FieldDescription, FieldGroup, FieldTitle } from '@/__shadcn__/components/ui/field'
import { Input } from '@/__shadcn__/components/ui/input'
import { Spinner } from '@/__shadcn__/components/ui/spinner'

import { useModel } from '../context'

const statusLabel = (x: ReturnType<typeof useModel>) => {
	if (x.wechat_qr_status === 'scanned') return 'Waiting confirmation'
	if (x.wechat_qr_status === 'needs_verify_code') return 'Needs code'
	if (x.wechat_qr_status === 'already_connected') return 'Already connected'
	if (x.wechat_qr_status === 'error') return 'Error'
	if (x.wechat_qr_loading || x.wechat_qr_polling) return 'Connecting'
	if (x.wechatConnectionReady) return 'Connected'
	return 'Not connected'
}

const statusVariant = (x: ReturnType<typeof useModel>) => {
	if (x.wechat_qr_status === 'error') return 'destructive'
	if (x.wechatConnectionReady) return 'secondary'
	return 'outline'
}

const Index = () => {
	const x = useModel()

	return (
		<>
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
					<div className='flex min-w-0 flex-col gap-3'>
						<div className='flex flex-wrap items-center gap-2'>
							<div className='text-sm font-medium'>WeChat ClawBot</div>
							<Badge variant={statusVariant(x)}>{statusLabel(x)}</Badge>
						</div>
						<div className='text-std-500 text-sm'>
							像 Hermes 一样扫码授权。连接成功后会自动填充账号凭据，保存当前 account
							后即可生效。
						</div>
						<div className='grid gap-2 text-sm sm:grid-cols-2'>
							<div
								className='
									px-3 py-2
									rounded-xl
									bg-background/70
									border
								'
							>
								<div className='text-std-400 text-xs'>Connect flow</div>
								<div className='mt-1 font-medium'>Scan QR and confirm on phone</div>
							</div>
							<div
								className='
									px-3 py-2
									rounded-xl
									bg-background/70
									border
								'
							>
								<div className='text-std-400 text-xs'>Current endpoint</div>
								<div className='mt-1 font-medium break-all'>
									{x.form.wechat_api_base_url || 'https://ilinkai.weixin.qq.com'}
								</div>
							</div>
						</div>
						{x.wechatConnectionReady ? (
							<div
								className='
									flex flex-wrap
									items-center
									gap-2
									text-sm text-emerald-600
								'
							>
								<CheckCircle2 className='size-4' />
								<span>Credentials are ready for this form.</span>
							</div>
						) : null}
					</div>
					<Button
						type='button'
						size='sm'
						onClick={() => void x.startWechatQrLogin()}
						disabled={x.wechat_qr_loading}
					>
						{x.wechat_qr_loading ? (
							<Spinner className='size-4' />
						) : (
							<QrCode className='size-4' />
						)}
						<span>{x.wechatConnectionReady ? 'Reconnect' : 'Connect WeChat'}</span>
					</Button>
				</div>

				<FieldGroup className='gap-0'>
					<div
						className='
							px-4 py-3
							rounded-2xl
							bg-background/70
							border
						'
					>
						<div className='flex items-start gap-3'>
							<ShieldEllipsis className='text-std-400 mt-0.5 size-4' />
							<div className='flex flex-col gap-1'>
								<FieldTitle className='text-base'>How it works</FieldTitle>
								<FieldDescription>
									点击连接后会拉起微信二维码。扫码并在手机上确认后，系统会自动写入当前表单
									需要的 `bot token`、`account id` 和 API 地址。
								</FieldDescription>
							</div>
						</div>
					</div>
				</FieldGroup>
			</div>

			<Dialog open={x.wechat_qr_dialog_open} onOpenChange={open => !open && x.closeWechatQrDialog()}>
				<DialogContent className='w-[560px] max-w-none!'>
					<DialogHeader>
						<DialogTitle>Connect WeChat</DialogTitle>
						<DialogDescription>
							{x.wechat_qr_message || 'Waiting for QR code...'}
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<div className='flex items-center gap-2'>
							<Badge variant={statusVariant(x)}>{statusLabel(x)}</Badge>
							{x.wechat_qr_polling ? (
								<LoaderCircle className='text-std-400 size-4 animate-spin' />
							) : null}
						</div>

						{x.wechat_qr_code_url ? (
							<div className='rounded-3xl border bg-white p-4'>
								<img
									alt='WeChat QR Code'
									className='
										aspect-square
										object-contain
										w-full max-w-[320px]
										mx-auto
										rounded-2xl
									'
									src={x.wechat_qr_code_url}
								/>
							</div>
						) : (
							<div
								className='
									flex
									items-center justify-center
									p-12
									rounded-3xl
									bg-muted/35
									border
								'
							>
								<Spinner />
							</div>
						)}

						{x.wechat_qr_code_url ? (
							<a
								className='
									w-fit
									text-std-400 text-xs
									underline
									decoration-std-150 underline-offset-4
								'
								href={x.wechat_qr_code_url}
								target='_blank'
							>
								Open QR in browser
							</a>
						) : null}

						{x.wechat_qr_status === 'needs_verify_code' ? (
							<div
								className='
									flex flex-col
									gap-3
									p-4
									rounded-2xl
									bg-muted/35
									border
								'
							>
								<div className='text-sm font-medium'>Phone verification code</div>
								<div className='text-std-500 text-sm'>
									如果微信扫码后出现数字验证码，把手机上显示的数字填到这里。
								</div>
								<div className='flex items-center gap-2'>
									<Input
										className='max-w-[220px]'
										value={x.wechat_qr_verify_code}
										onChange={event => {
											x.wechat_qr_verify_code = event.target.value
										}}
										placeholder='Enter digits from your phone'
									/>
								</div>
							</div>
						) : null}
					</div>

					<DialogFooter className='items-center justify-between sm:justify-between'>
						<div className='text-std-400 text-xs'>
							连接成功后，当前表单会自动回填，随后点击保存即可。
						</div>
						<div className='flex items-center gap-2'>
							{x.wechat_qr_status === 'needs_verify_code' ? (
								<Button
									type='button'
									onClick={() => void x.submitWechatQrVerifyCode()}
									disabled={x.wechat_qr_verify_loading}
								>
									{x.wechat_qr_verify_loading ? (
										<Spinner className='size-4' />
									) : null}
									<span>Submit Code</span>
								</Button>
							) : null}
							<Button
								type='button'
								variant='outline'
								onClick={() => x.closeWechatQrDialog()}
							>
								Close
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default observer(Index)
