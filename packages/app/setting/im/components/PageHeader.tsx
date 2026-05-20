import { Bird, Bot, QrCode } from 'lucide-react'
import { observer } from 'mobx-react-lite'

import { TextTabs } from '@/components'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const items = [
	{ key: 'wechat', title: 'WeChat', Icon: QrCode },
	{ key: 'discord', title: 'Discord', Icon: Bot },
	{ key: 'feishu', title: 'Feishu', Icon: Bird }
]

const docsMap = {
	wechat: {
		label: 'WeChat ClawBot guide',
		href: 'https://www.runoob.com/ai-agent/openclaw-weixin.html'
	},
	discord: {
		label: 'Discord ClawBot guide',
		href: 'https://docs.openclaw.ai/channels/discord'
	},
	feishu: {
		label: 'Feishu Open Platform docs',
		href: 'https://open.feishu.cn/document/mcp_open_tools/integrating-agents-with-feishu/overview'
	}
} as const

const Index = () => {
	const x = useModel()
	const docs = docsMap[x.form.platform]

	return (
		<div className='flex flex-col gap-4'>
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
