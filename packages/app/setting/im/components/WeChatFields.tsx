import { useEffect, useRef } from 'react'
import { CheckCircle2, ExternalLink, LoaderCircle, QrCode, ShieldEllipsis } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

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
	if (x.wechat_qr_status === 'scanned') return 'im.wechat_status_waiting_confirmation'
	if (x.wechat_qr_status === 'needs_verify_code') return 'im.wechat_status_needs_code'
	if (x.wechat_qr_status === 'already_connected') return 'im.wechat_status_already_connected'
	if (x.wechat_qr_status === 'error') return 'im.wechat_status_error'
	if (x.wechat_qr_loading || x.wechat_qr_polling) return 'im.wechat_status_connecting'
	if (x.wechatConnectionReady) return 'im.wechat_status_connected'
	return 'im.wechat_status_not_connected'
}

const statusVariant = (x: ReturnType<typeof useModel>) => {
	if (x.wechat_qr_status === 'error') return 'destructive'
	if (x.wechatConnectionReady) return 'secondary'
	return 'outline'
}

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')
	const last_opened_qr_url_ref = useRef('')

	useEffect(() => {
		if (!x.wechat_qr_dialog_open || !x.wechat_qr_code_url) return
		if (last_opened_qr_url_ref.current === x.wechat_qr_code_url) return

		last_opened_qr_url_ref.current = x.wechat_qr_code_url
		window.open(x.wechat_qr_code_url, '_blank', 'noopener,noreferrer')
	}, [x.wechat_qr_dialog_open, x.wechat_qr_code_url])

	const openQrWindow = () => {
		if (!x.wechat_qr_code_url) return
		last_opened_qr_url_ref.current = x.wechat_qr_code_url
		window.open(x.wechat_qr_code_url, '_blank', 'noopener,noreferrer')
	}

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
							<div className='text-sm font-medium'>{t('im.wechat_title')}</div>
							<Badge variant={statusVariant(x)}>{t(statusLabel(x))}</Badge>
						</div>
						<div className='text-std-500 text-sm'>{t('im.wechat_desc')}</div>
						<div className='grid gap-2 text-sm sm:grid-cols-2'>
							<div
								className='
									px-3 py-2
									rounded-xl
									bg-background/70
									border
								'
							>
								<div className='text-std-400 text-xs'>
									{t('im.wechat_connect_flow')}
								</div>
								<div className='mt-1 font-medium'>
									{t('im.wechat_connect_flow_desc')}
								</div>
							</div>
							<div
								className='
									px-3 py-2
									rounded-xl
									bg-background/70
									border
								'
							>
								<div className='text-std-400 text-xs'>
									{t('im.wechat_current_endpoint')}
								</div>
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
								<span>{t('im.wechat_credentials_ready')}</span>
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
						<span>
							{x.wechatConnectionReady ? t('im.wechat_reconnect') : t('im.wechat_connect')}
						</span>
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
								<FieldTitle className='text-base'>
									{t('im.wechat_how_it_works')}
								</FieldTitle>
								<FieldDescription>{t('im.wechat_how_it_works_desc')}</FieldDescription>
							</div>
						</div>
					</div>
				</FieldGroup>
			</div>

			<Dialog open={x.wechat_qr_dialog_open} onOpenChange={open => !open && x.closeWechatQrDialog()}>
				<DialogContent className='w-[560px] max-w-none!'>
					<DialogHeader>
						<DialogTitle>{t('im.wechat_dialog_title')}</DialogTitle>
						<DialogDescription>
							{x.wechat_qr_message || t('im.wechat_waiting_qr')}
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-4'>
						<div className='flex items-center gap-2'>
							<Badge variant={statusVariant(x)}>{t(statusLabel(x))}</Badge>
							{x.wechat_qr_polling ? (
								<LoaderCircle className='text-std-400 size-4 animate-spin' />
							) : null}
						</div>

						<div
							className='
								flex flex-col
								gap-3
								p-4
								rounded-3xl
								bg-muted/35
								border
							'
						>
							<div className='flex items-start gap-3'>
								<QrCode className='text-std-400 mt-0.5 size-4 shrink-0' />
								<div className='flex flex-col gap-1'>
									<div className='text-sm font-medium'>
										{t('im.wechat_qr_browser_title')}
									</div>
									<div className='text-std-500 text-sm'>
										{t('im.wechat_qr_browser_desc')}
									</div>
								</div>
							</div>
							<div className='flex flex-wrap items-center gap-2'>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={openQrWindow}
									disabled={!x.wechat_qr_code_url}
								>
									<ExternalLink className='size-4' />
									<span>{t('im.wechat_open_qr_window')}</span>
								</Button>
								<div className='text-std-400 text-xs'>{t('im.wechat_popup_hint')}</div>
							</div>
						</div>

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
								<div className='text-sm font-medium'>
									{t('im.wechat_phone_code_title')}
								</div>
								<div className='text-std-500 text-sm'>
									{t('im.wechat_phone_code_desc')}
								</div>
								<div className='flex items-center gap-2'>
									<Input
										className='max-w-[220px]'
										value={x.wechat_qr_verify_code}
										onChange={event => {
											x.wechat_qr_verify_code = event.target.value
										}}
										placeholder={t('im.wechat_phone_code_placeholder')}
									/>
								</div>
							</div>
						) : null}
					</div>

					<DialogFooter className='items-center justify-between sm:justify-between'>
						<div className='text-std-400 text-xs'>{t('im.wechat_saved_hint')}</div>
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
									<span>{t('im.wechat_submit_code')}</span>
								</Button>
							) : null}
							<Button
								type='button'
								variant='outline'
								onClick={() => x.closeWechatQrDialog()}
							>
								{t('im.close')}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default observer(Index)
