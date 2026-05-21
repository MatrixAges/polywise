import { observer } from 'mobx-react-lite'
import { FaDiscord } from 'react-icons/fa'
import { IoLogoWechat } from 'react-icons/io5'

import { TextTabs } from '@/components'
import Logo from '@/public/icons/feishu.svg?react'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const items = [
	{ key: 'wechat', title: 'WeChat', Icon: IoLogoWechat },
	{ key: 'discord', title: 'Discord', Icon: FaDiscord },
	{ key: 'feishu', title: 'Feishu', Icon: Logo }
]

const docsMap = {
	wechat: {
		label: 'WeChat ClawBot guide',
		href: 'https://www.runoob.com/ai-agent/openclaw-weixin.html'
	},
	discord: {
		label: 'Discord Bot guide',
		href: 'https://docs.openclaw.ai/channels/discord'
	},
	feishu: {
		label: 'Feishu Agent docs',
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
