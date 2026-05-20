import { Bot, QrCode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const items = [
	{ key: 'discord', title: 'Discord', Icon: Bot },
	{ key: 'wechat', title: 'WeChat', Icon: QrCode }
]

const PlatformTabs = () => {
	const x = useModel()

	return (
		<div
			className='
				flex flex-wrap
				items-center justify-between
				gap-3
				p-5
				rounded-3xl
				bg-background/70
				border
			'
		>
			<div>
				<div className='text-sm font-medium'>Platform</div>
				<div className='text-std-500 text-sm'>
					Choose Discord or WeChat first, then fill the account form below.
				</div>
			</div>
			<TextTabs
				className='gap-3'
				items={items}
				active={x.form.platform}
				setActive={value => x.updateForm('platform', value as ImPlatform)}
			></TextTabs>
		</div>
	)
}

export default observer(PlatformTabs)
