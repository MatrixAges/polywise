'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
	BoxArrowDownIcon,
	CaretRightIcon,
	ChatDotsIcon,
	MagnifyingGlassIcon,
	MoonIcon,
	SunDimIcon,
	TreeIcon
} from '@phosphor-icons/react'
import { useMenu } from '@website/appdata/docs'
import { Search } from '@website/appunits/docs'
import DocBottomLink from '@website/components/DocBottomLink'
import { toc_emitter } from '@website/components/DocContentPage'
import Logo from '@website/components/Logo'
import Modal from '@website/components/Modal'
import Sheet from '@website/components/ui/Sheet'
import { useEventListener, useLocalStorageState, useMemoizedFn, useUpdateEffect } from '@website/hooks/ahooks'
import useRouterHash from '@website/hooks/useRouterHash'
import useTheme from '@website/hooks/useTheme'
import { $ } from '@website/utils'
import getTargetIndex from '@website/utils/getTargetIndex'
import { uniq } from 'lodash-es'
import { AlignJustify, AlignLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

import styles from './layout.module.css'

import type { DocsMenuGroup, DocsMenuItem } from '@website/types'
import type { PropsWithChildren } from 'react'

type BottomLinkItem = Pick<DocsMenuItem, 'label' | 'key'> | null

const Index = (props: PropsWithChildren) => {
	const { children } = props
	const params = useParams<{ id: Array<string> }>()
	const pathname = usePathname()
	const hash = useRouterHash()
	const menu_ref = useRef<HTMLDivElement>(null)
	const t = useTranslations('docs')
	const { theme, setTheme } = useTheme()
	const menu = useMenu()
	const [local_openkeys, setLocalOpenkeys] = useLocalStorageState<Array<string>>('docs/openkeys', {
		defaultValue: []
	})
	const [selectedkey, setSelectedkey] = useState<string>()
	const [openkeys, setOpenkeys] = useState<Array<string>>([])
	const [open_search, setOpenSearch] = useState(false)
	const [open_sidebar, setOpenSidebar] = useState(false)
	const [bottom_links, setBottomLinks] = useState<{
		prev_link: BottomLinkItem
		next_link: BottomLinkItem
	}>({ prev_link: null, next_link: null })

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

	const toggleGroup = useMemoizedFn((key: string) => {
		setLocalOpenkeys(value => {
			const target = value ?? []

			return target.includes(key) ? target.filter(item => item !== key) : [...target, key]
		})
	})

	const onClickLink = useMemoizedFn(() => setOpenSidebar(false))

	useEffect(() => {
		const paths = route_path ? route_path.split('/') : []

		if (paths.length === 0) {
			setSelectedkey('')
			setBottomLinks({ prev_link: null, next_link: null })

			return
		}

		const fold_key = paths[0]
		const key = paths.join('/')

		setSelectedkey(key)
		if (fold_key) {
			setLocalOpenkeys(value => {
				const current = value ?? []

				return current.includes(fold_key) ? current : uniq([...current, fold_key])
			})
		}

		const target_item = menu.flatMap(group => group.children).find(item => item.key === key)

		const menu_el = menu_ref.current

		if (menu_el && target_item?.className) {
			const el = menu_el.querySelector(`.${target_item.className}`) as HTMLElement | null

			if (el) {
				const timer = setTimeout(() => {
					el.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
						inline: 'nearest'
					})
				}, 300)

				return () => clearTimeout(timer)
			}
		}

		const { parent_index, index } = getTargetIndex(menu, key)

		if (parent_index === -1 || index === -1) return

		let prev_link = null as BottomLinkItem
		let next_link = null as BottomLinkItem

		const target_group = menu[parent_index]!.children
		const prev = target_group[index - 1]
		const next = target_group[index + 1]

		if (prev) {
			prev_link = prev
		} else {
			const prev_target = menu[parent_index - 1] as DocsMenuGroup | undefined

			if (prev_target) {
				prev_link = prev_target.children.at(-1) ?? null
			}
		}

		if (next) {
			next_link = next
		} else {
			const next_target = menu[parent_index + 1] as DocsMenuGroup | undefined

			if (next_target) {
				next_link = next_target.children.at(0) ?? null
			}
		}

		setBottomLinks({ prev_link, next_link })
	}, [menu, route_path, setLocalOpenkeys])

	useEffect(() => {
		if (!local_openkeys) return

		setOpenkeys(local_openkeys)
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

	const show_btn_doc = useMemo(() => !['/docs', '/docs/gtd'].includes(pathname), [pathname])

	const SidebarContent = (
		<>
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
			<div className='menu_wrap box-border w-full' ref={menu_ref}>
				<div className='menu_groups flex flex-col'>
					{menu.map(group => {
						const open = openkeys.includes(group.key)
						const active =
							selectedkey === group.key ||
							group.children.some(item => item.key === selectedkey)

						return (
							<section
								className={$.cx('menu_group', open ? 'mb-6' : 'mb-2')}
								key={group.key}
							>
								<button
									className={$.cx(
										`
									flex
									items-center justify-between
									w-full
									font-medium
									menu_group_button cursor-pointer
								`,
										active && 'active'
									)}
									type='button'
									onClick={() => toggleGroup(group.key)}
								>
									<span>{group.label}</span>
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
										menu_group_items
									'
									>
										{group.children.map(item => (
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
					})}
				</div>
				{openkeys.length < 2 && (
					<div className='shadow_tree flex items-center justify-center'>
						<TreeIcon weight='thin'></TreeIcon>
					</div>
				)}
			</div>
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
					href='/download'
				>
					<BoxArrowDownIcon size={15} weight='fill'></BoxArrowDownIcon>
					<span className='ml-2'>{t('footer.download')}</span>
				</Link>
				<Link
					className='
						box-border
						flex
						items-center
						w-full
						footer_item clickable
					'
					href='/contact'
				>
					<ChatDotsIcon size={15} weight='fill'></ChatDotsIcon>
					<span className='ml-2'>{t('footer.contact')}</span>
				</Link>
			</div>
		</>
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
				{SidebarContent}
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
					{SidebarContent}
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
