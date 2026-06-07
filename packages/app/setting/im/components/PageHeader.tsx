import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FaDiscord } from 'react-icons/fa'
import { IoLogoWechat } from 'react-icons/io5'

import { TextTabs } from '@/components'
import Logo from '@/public/icons/feishu.svg?react'

import { useModel } from '../context'

import type { ImPlatform } from '../model'

const docsMap = {
	wechat: {
		label: 'im.wechat_docs',
		href: 'https://www.runoob.com/ai-agent/openclaw-weixin.html'
	},
	discord: {
		label: 'im.discord_docs',
		href: 'https://docs.openclaw.ai/channels/discord'
	},
	feishu: {
		label: 'im.feishu_docs',
		href: 'https://open.feishu.cn/document/mcp_open_tools/integrating-agents-with-feishu/overview'
	}
} as const

const Index = () => {
	const x = useModel()
	const { t } = useTranslation('setting')
	const items = [
		{ key: 'wechat', title: t('im.wechat'), Icon: IoLogoWechat },
		{ key: 'discord', title: t('im.discord'), Icon: FaDiscord },
		{ key: 'feishu', title: t('im.feishu'), Icon: Logo }
	]
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
				{t(docs.label)}
			</a>
		</div>
	)
}

export default observer(Index)
