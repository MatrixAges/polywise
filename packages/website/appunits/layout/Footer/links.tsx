import { DiscordLogo, GithubLogo, RedditLogo, XLogo, YoutubeLogo } from '@phosphor-icons/react'
import { mas_link, medias } from '@website/appdata/app'

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

export const media_items = [
	{
		link: medias.discord,
		Icon: DiscordLogo
	},
	{
		link: medias.github,
		Icon: GithubLogo
	},
	{
		link: medias.x,
		Icon: XLogo
	}
]
