import { DiscordLogo, GithubLogo, RedditLogo, XLogo, YoutubeLogo } from '@phosphor-icons/react'
import { mas_link, medias } from '@website/appdata/app'

export default ['/', '/doc', '/price', '/blog', '/gtd', '/activate']

export const link_groups = [
	{
		title: 'product',
		items: [
			// {
			// 	title: 'features',
			// 	link: '/features'
			// },
			// {
			// 	title: 'solutions',
			// 	link: '/solutions'
			// },
			{
				title: 'docs',
				link: '/docs'
			},
			{
				title: 'changelog',
				link: '/changelog'
			},
			{
				title: 'journal',
				link: '/journal'
			},
			// {
			// 	title: 'pricing',
			// 	link: '/pricing'
			// },
			{
				title: 'download',
				link: '/download'
			}
		]
	},
	{
		title: 'resources',
		items: [
			{
				title: 'privacy',
				link: '/privacy'
			},
			{
				title: 'terms',
				link: '/terms'
			},
			{
				title: 'refund',
				link: '/refund'
			}
			// {
			// 	title: 'appstore',
			// 	link: mas_link
			// }
		]
	},
	{
		title: 'company',
		items: [
			{
				title: 'activate',
				link: '/activate'
			},
			// {
			// 	title: 'about_us',
			// 	link: '/about_us'
			// },
			{
				title: 'contact',
				link: '/contact'
			},
			// {
			// 	title: 'blog',
			// 	link: '/blog'
			// },
			{
				title: 'brand',
				link: '/brand'
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
