import { Bot, MessageCircle, QrCode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const items = [
	{ key: 'discord', title: 'Discord', Icon: Bot },
	{ key: 'wechat', title: 'WeChat', Icon: QrCode }
]

const Index = () => {
	const x = useModel()

	return (
		<div className='flex'>
			<div className='h-9'>
				<TextTabs
					className='gap-3'
					items={items}
					active={x.form.platform}
					setActive={value => x.selectPlatform(value as ImPlatform)}
				></TextTabs>
			</div>
		</div>
	)
}

export default observer(Index)
