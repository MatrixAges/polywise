import { DiscordLogoIcon, GithubLogoIcon, RedditLogoIcon, XLogoIcon, YoutubeLogoIcon } from '@phosphor-icons/react'
import { medias } from '@website/appdata/app'

export default ['/', '/doc', '/price', '/blog', '/gtd', '/activate']

export const link_groups = [
	{
		title: 'product',
		items: [
			{
				title: 'docs',
				link: '/docs'
			},
			{
				title: 'download',
				link: '/download'
			},
			{
				title: 'github',
				link: 'https://github.com/MatrixAges/polywise'
			}
		]
	}
]

export const getLinkGroups = ({ locale }: { locale: string }) => {
	if (locale !== 'zh') return link_groups

	return [
		...link_groups,
		{
			title: 'friend_links',
			items: [
				{
					title: 'linux_do',
					link: 'https://linux.do'
				}
			]
		}
	]
}

export const media_items = [
	{
		link: medias.discord,
		Icon: DiscordLogoIcon
	},
	{
		link: medias.github,
		Icon: GithubLogoIcon
	},
	{
		link: medias.x,
		Icon: XLogoIcon
	}
]
