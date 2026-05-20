import { Bot, MessageCircle, QrCode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const items = [
	{ key: 'discord', title: 'Discord', Icon: Bot },
	{ key: 'wechat', title: 'WeChat', Icon: QrCode }
]

const PageHeader = () => {
	const x = useModel()

	return (
		<div
			className='
				flex flex-wrap
				items-start justify-between
				gap-3
			'
		>
			<div className='flex flex-col gap-1'>
				<div className='flex items-center gap-2'>
					<div className='bg-muted rounded-2xl p-2'>
						<MessageCircle className='size-4' />
					</div>
					<div>
						<div className='text-lg font-semibold'>IM Integration</div>
						<div className='text-std-500 text-sm'>
							Configure Discord and WeChat accounts for the IM runtime
						</div>
					</div>
				</div>
			</div>
			<TextTabs
				className='gap-3'
				items={items}
				active={x.form.platform}
				setActive={value => x.selectPlatform(value as ImPlatform)}
			></TextTabs>
		</div>
	)
}

export default observer(PageHeader)
