'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
	BoxArrowDownIcon,
	CaretRightIcon,
	GithubLogoIcon,
	MagnifyingGlassIcon,
	MoonIcon,
	SunDimIcon,
	TreeIcon
} from '@phosphor-icons/react'
import { medias } from '@website/appdata/app'
import { flattenMenuItems, useMenu } from '@website/appdata/docs'
import { Search } from '@website/appunits/docs'
import DocBottomLink from '@website/components/DocBottomLink'
import { toc_emitter } from '@website/components/DocContentPage'
import Logo from '@website/components/Logo'
import Modal from '@website/components/Modal'
import Sheet from '@website/components/ui/Sheet'
import { useEventListener, useMemoizedFn, useUpdateEffect } from '@website/hooks/ahooks'
import useRouterHash from '@website/hooks/useRouterHash'
import useTheme from '@website/hooks/useTheme'
import { $ } from '@website/utils'
import { uniq } from 'lodash-es'
import { AlignJustify, AlignLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

import styles from './layout.module.css'

import type { DocsMenuItem } from '@website/types'
import type { JSX, PropsWithChildren, ReactNode } from 'react'

type BottomLinkItem = Pick<DocsMenuItem, 'label' | 'key'> | null
const docs_openkeys_storage_key = 'docs/openkeys'
const sidebar_scroll_top_map: Record<'desktop' | 'mobile', number> = {
	desktop: 0,
	mobile: 0
}

interface SidebarMenuWrapProps {
	cache_key: 'desktop' | 'mobile'
	children: ReactNode
}

const SidebarMenuWrap = $.memo((props: SidebarMenuWrapProps) => {
	const { cache_key, children } = props
	const ref = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		const element = ref.current

		if (!element) return

		element.scrollTop = sidebar_scroll_top_map[cache_key]
	}, [cache_key, children])

	const onScroll = useMemoizedFn(() => {
		const element = ref.current

		if (!element) return

		sidebar_scroll_top_map[cache_key] = element.scrollTop
	})

	return (
		<div className='menu_wrap box-border w-full' ref={ref} onScroll={onScroll}>
			{children}
		</div>
	)
})

const Index = (props: PropsWithChildren) => {
	const { children } = props
	const params = useParams<{ id: Array<string> }>()
	const pathname = usePathname()
	const hash = useRouterHash()
	const t = useTranslations('docs')
	const { theme, setTheme } = useTheme()
	const menu = useMenu()
	const flat_items = useMemo(() => flattenMenuItems(menu), [menu])
	const [local_openkeys, setLocalOpenkeys] = useState<Array<string>>([])
	const [open_search, setOpenSearch] = useState(false)
	const [open_sidebar, setOpenSidebar] = useState(false)

	const setDark = useMemoizedFn(() => setTheme('dark'))
	const setLight = useMemoizedFn(() => setTheme('light'))
	const openSearch = useMemoizedFn(() => {
		setOpenSearch(true)
		setOpenSidebar(false)
	})
	const closeSearch = useMemoizedFn(() => setOpenSearch(false))
	const onOpenSidebar = useMemoizedFn(() => setOpenSidebar(true))
	const onCloseSidebar = useMemoizedFn(() => setOpenSidebar(false))
	const route_path = params?.id?.join('/') ?? ''
	const selectedkey = route_path
	const current_group_key = useMemo(() => {
		const current_group = menu.find(
			section => section.type === 'group' && section.children.some(item => item.key === route_path)
		)

		return current_group?.key ?? ''
	}, [menu, route_path])
	const openkeys = useMemo(() => {
		const target = local_openkeys ?? []

		if (!current_group_key) return target

		return target.includes(current_group_key) ? target : uniq([...target, current_group_key])
	}, [current_group_key, local_openkeys])
	const bottom_links = useMemo(() => {
		if (!route_path) {
			return { prev_link: null, next_link: null } as {
				prev_link: BottomLinkItem
				next_link: BottomLinkItem
			}
		}

		const index = flat_items.findIndex(item => item.key === route_path)

		if (index === -1) {
			return { prev_link: null, next_link: null } as {
				prev_link: BottomLinkItem
				next_link: BottomLinkItem
			}
		}

		return {
			prev_link: flat_items[index - 1] ?? null,
			next_link: flat_items[index + 1] ?? null
		}
	}, [flat_items, route_path])

	const toggleGroup = useMemoizedFn((key: string) => {
		setLocalOpenkeys(value => {
			const target = value ?? []

			return target.includes(key) ? target.filter(item => item !== key) : [...target, key]
		})
	})

	const onClickLink = useMemoizedFn(() => setOpenSidebar(false))

	useEffect(() => {
		if (typeof window === 'undefined') return

		const raw = window.localStorage.getItem(docs_openkeys_storage_key)

		if (raw == null) return

		try {
			const next = JSON.parse(raw) as Array<string>

			setLocalOpenkeys(Array.isArray(next) ? next : [])
		} catch {
			setLocalOpenkeys([])
		}
	}, [])

	useEffect(() => {
		if (typeof window === 'undefined') return

		window.localStorage.setItem(docs_openkeys_storage_key, JSON.stringify(local_openkeys))
	}, [local_openkeys])

	useEventListener('keypress', event => {
		const keyboard_event = event as KeyboardEvent

		if (keyboard_event.key === 'k' && keyboard_event.ctrlKey) {
			setOpenSearch(true)
		}
	})

	const onToc = useMemoizedFn(() => {
		toc_emitter.dispatchEvent(new CustomEvent('show_toc'))
	})

	useUpdateEffect(() => {
		onCloseSidebar()
	}, [pathname, hash])

	const show_btn_doc = useMemo(() => pathname !== '/docs', [pathname])
	const open_group_count = useMemo(
		() => openkeys.filter(key => menu.some(section => section.type === 'group' && section.key === key)).length,
		[menu, openkeys]
	)

	const Header = (
		<div
			className='
				relative
				box-border
				flex flex-col
				w-full
				header_wrap
			'
		>
			<div
				className='
					absolute
					left-0
					w-full
					menu_mask top
				'
			></div>
			<div className='top_row flex items-center justify-between'>
				<div className='flex items-center'>
					<Link
						className='
							flex
							items-center justify-center
							logo_wrap clickable
						'
						href='/'
					>
						<Logo size={13} color='var(--color_bg)'></Logo>
					</Link>
					<div className='d_line'></div>
					<Link className='title clickable' href='/docs'>
						{t('header.title')}
					</Link>
				</div>
				<div className='theme_toggle flex'>
					<button
						className={$.cx(
							`
							flex
							items-center justify-center
							theme_item clickable
						`,
							theme === 'dark' && 'active'
						)}
						type='button'
						onClick={setDark}
					>
						<MoonIcon weight='fill'></MoonIcon>
					</button>
					<button
						className={$.cx(
							`
							flex
							items-center justify-center
							theme_item clickable
						`,
							theme === 'light' && 'active'
						)}
						type='button'
						onClick={setLight}
					>
						<SunDimIcon weight='fill'></SunDimIcon>
					</button>
				</div>
			</div>
			<div
				className='
					relative
					box-border
					flex
					items-center
					w-full
					btn_search_wrap clickable
				'
				onClick={openSearch}
			>
				<MagnifyingGlassIcon className='icon_search absolute' weight='bold'></MagnifyingGlassIcon>
				<button className='btn_search box-border w-full cursor-pointer' type='button'>
					{t('header.btn_search')}
				</button>
				<div className='shortcuts absolute flex'>
					<kbd className='box-border flex items-center justify-center'>⌘</kbd>
					<kbd className='box-border flex items-center justify-center'>K</kbd>
				</div>
			</div>
		</div>
	)

	const renderSidebarMenu = (cache_key: 'desktop' | 'mobile') => (
		<SidebarMenuWrap cache_key={cache_key}>
			<div className='menu_groups flex flex-col'>
				{(() => {
					const groups: Array<JSX.Element> = []
					let flat_group_items: Array<JSX.Element> = []

					const flushFlatGroup = () => {
						if (flat_group_items.length === 0) return

						groups.push(
							<div
								className='flat_group mb-6 flex flex-col'
								key={`flat_group_${groups.length}`}
							>
								{flat_group_items}
							</div>
						)

						flat_group_items = []
					}

					menu.forEach(section => {
						if (section.type === 'link') {
							flat_group_items.push(
								<Link
									className={$.cx(
										'menu_item mb-1 flex items-center',
										section.className,
										selectedkey === section.key && 'active'
									)}
									href={`/docs/${section.key}`}
									key={section.key}
									onClick={onClickLink}
								>
									<span>{section.label}</span>
								</Link>
							)

							return
						}

						flushFlatGroup()

						const open = openkeys.includes(section.key)
						const active =
							selectedkey === section.key ||
							section.children.some(item => item.key === selectedkey)

						groups.push(
							<section
								className={$.cx('menu_group', open ? 'mb-6' : 'mb-1')}
								key={section.key}
							>
								<button
									className={$.cx(
										`
										flex
										items-center justify-between
										w-full
										mb-1
										font-medium
										menu_group_button cursor-pointer
									`,
										active && 'active'
									)}
									type='button'
									onClick={() => toggleGroup(section.key)}
								>
									<span>{section.label}</span>
									<CaretRightIcon
										className={$.cx(
											'icon transition-transform duration-200',
											open && 'rotate-90'
										)}
										size={12}
										weight='bold'
									/>
								</button>
								{open && (
									<div
										className='
											flex flex-col
											w-full
											gap-1
											menu_group_items
										'
									>
										{section.children.map(item => (
											<Link
												className={$.cx(
													'menu_item flex items-center',
													item.className,
													selectedkey === item.key && 'active'
												)}
												href={`/docs/${item.key}`}
												key={item.key}
												onClick={onClickLink}
											>
												<span>{item.label}</span>
											</Link>
										))}
									</div>
								)}
							</section>
						)
					})

					flushFlatGroup()

					return groups
				})()}
			</div>
			{open_group_count < 2 && (
				<div className='shadow_tree flex items-center justify-center'>
					<TreeIcon weight='thin'></TreeIcon>
				</div>
			)}
		</SidebarMenuWrap>
	)

	const Footer = (
		<div
			className='
				relative
				box-border
				flex flex-col
				w-full
				footer_wrap
			'
		>
			<div
				className='
					absolute
					left-0
					w-full
					menu_mask bottom
				'
			></div>
			<Link
				className='
					box-border
					flex
					items-center
					w-full
					footer_item clickable
				'
				target='_blank'
				href={medias.github}
			>
				<GithubLogoIcon size={15} weight='fill'></GithubLogoIcon>
				<span className='ml-2'>{t('footer.github')}</span>
			</Link>
			<Link
				className='
					box-border
					flex
					items-center
					w-full
					footer_item clickable
				'
				href='/download'
			>
				<BoxArrowDownIcon size={15} weight='fill'></BoxArrowDownIcon>
				<span className='ml-2'>{t('footer.download')}</span>
			</Link>
		</div>
	)

	return (
		<div className={$.cx('w-screen', styles._local)}>
			<Modal
				bodyClassName={styles.search_modal}
				open={open_search}
				width={480}
				onCancel={closeSearch}
				maskClosable
			>
				<Search closeSearch={closeSearch}></Search>
			</Modal>
			<nav
				className={$.cx(
					`
					fixed
					top-0
					left-0
					box-border
					z-100
					flex flex-col
					h-screen
					doc_sidebar
				`,
					styles.sidebar
				)}
			>
				{Header}
				{renderSidebarMenu('desktop')}
				{Footer}
			</nav>
			<Sheet
				rootClassName={styles.sidebar_drawer}
				open={open_sidebar}
				placement='left'
				maskClosable
				width={300}
				closeIcon={false}
				onClose={onCloseSidebar}
			>
				<div
					className={$.cx(
						`
						flex flex-col
						w-full h-full
						doc_sidebar
					`,
						styles.sidebar
					)}
				>
					{Header}
					{renderSidebarMenu('mobile')}
					{Footer}
				</div>
			</Sheet>
			<div
				className='
					fixed
					top-0
					left-0
					box-border
					z-1000
					flex
					items-center justify-between
					w-full
					doc_header
				'
			>
				<div
					className='
						flex
						items-center justify-center
						btn_wrap clickable
					'
					onClick={onOpenSidebar}
				>
					<AlignJustify size={16}></AlignJustify>
				</div>
				{show_btn_doc && (
					<div
						className='
							flex
							items-center justify-center
							btn_wrap clickable
						'
						onClick={onToc}
					>
						<AlignLeft size={16}></AlignLeft>
					</div>
				)}
			</div>
			<article className={styles.article}>
				{children}
				{params?.id && (
					<DocBottomLink
						prev={bottom_links.prev_link}
						next={bottom_links.next_link}
					></DocBottomLink>
				)}
			</article>
		</div>
	)
}

export default $.memo(Index)
