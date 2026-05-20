import { Bot, MessageCircle, QrCode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const items = [
	{ key: 'discord', title: 'Discord', Icon: Bot },
	{ key: 'wechat', title: 'WeChat', Icon: QrCode }
]

const docsMap = {
	discord: {
		label: 'OpenClaw Discord guide',
		href: 'https://docs.openclaw.ai/channels/discord'
	},
	wechat: {
		label: 'OpenClaw WeChat guide',
		href: 'https://www.runoob.com/ai-agent/openclaw-weixin.html'
	}
} as const

const Index = () => {
	const x = useModel()
	const docs = docsMap[x.form.platform]

	return (
		<div className='flex flex-col gap-2'>
			<div className='h-9'>
				<TextTabs
					className='gap-3'
					items={items}
					active={x.form.platform}
					setActive={value => x.selectPlatform(value as ImPlatform)}
				></TextTabs>
			</div>
			<a
				className='
					w-fit
					text-std-400 text-xs
					underline
					decoration-std-150 underline-offset-4
				'
				href={docs.href}
				target='_blank'
			>
				{docs.label}
			</a>
		</div>
	)
}

export default observer(Index)
