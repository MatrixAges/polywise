'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BoxArrowDown, ChatDots, MagnifyingGlass, Moon, SunDim, Tree } from '@phosphor-icons/react'
import { useMenu } from '@website/appdata/docs'
import { Search } from '@website/appunits/docs'
import DocBottomLink from '@website/components/DocBottomLink'
import { toc_emitter } from '@website/components/DocContentPage'
import Logo from '@website/components/Logo'
import Modal from '@website/components/Modal'
import { useEventListener, useLocalStorageState, useMemoizedFn, useUpdateEffect } from '@website/hooks/ahooks'
import useRouterHash from '@website/hooks/useRouterHash'
import useTheme from '@website/hooks/useTheme'
import { Link, usePathname, useRouter } from '@website/i18n/navigation'
import { $ } from '@website/utils'
import getTargetIndex from '@website/utils/getTargetIndex'
import { Drawer, Menu } from 'antd'
import { uniq } from 'lodash-es'
import { AlignJustify, AlignLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'

import styles from './layout.module.css'

import type { MenuRef } from 'antd'
import type { MenuItemGroupType } from 'antd/es/menu/interface'
import type { PropsWithChildren } from 'react'

type BottomLinkItem = { label: string; key: string } | null

const Index = (props: PropsWithChildren) => {
	const { children } = props
	const router = useRouter()
	const params = useParams<{ id: Array<string> }>()
	const pathname = usePathname()
	const hash = useRouterHash()
	const ref = useRef<MenuRef>(null)
	const t = useTranslations('docs')
	const { theme, setTheme } = useTheme()
	const menu = useMenu()!
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
	const onSelect = useMemoizedFn(({ key }) => setSelectedkey(key))
	const onOpenChange = useMemoizedFn(v => setLocalOpenkeys(v))
	const onClick = useMemoizedFn(({ key }) => router.push(`/docs/${key}`))

	useEffect(() => {
		const paths = params?.id || [pathname.replace('/docs/', '')]

		if (!paths || !Array.isArray(paths)) return setSelectedkey('')

		const fold_key = paths[0]
		const key = paths.join('/')

		setSelectedkey(key)
		setLocalOpenkeys(v => uniq([...(v || []), fold_key]))

		const menu_el = ref.current?.menu?.list

		if (!menu_el) return

		const el = menu_el.querySelector(`.${key.replace('/', '-')}`)!

		if (!el) return

		const timer = setTimeout(() => {
			el.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest'
			})
		}, 300)

		const { parent_index, index } = getTargetIndex(menu, key)

		let prev_link = null as BottomLinkItem
		let next_link = null as BottomLinkItem

		const target_group = (menu[parent_index]! as MenuItemGroupType).children!
		const prev = target_group[index - 1]
		const next = target_group[index + 1]

		if (prev) {
			prev_link = prev as BottomLinkItem
		} else {
			const prev_target = menu[parent_index - 1] as MenuItemGroupType

			if (prev_target) {
				prev_link = prev_target.children!.at(-1) as BottomLinkItem
			}
		}

		if (next) {
			next_link = next as BottomLinkItem
		} else {
			const next_target = menu[parent_index + 1] as MenuItemGroupType

			if (next_target) {
				next_link = next_target.children!.at(0) as BottomLinkItem
			}
		}

		setBottomLinks({ prev_link, next_link })

		return () => clearTimeout(timer)
	}, [params, pathname])

	useEffect(() => {
		if (!local_openkeys) return

		setOpenkeys(local_openkeys)
	}, [local_openkeys])

	useEventListener('keypress', e => {
		if (e.key === 'k' && e.ctrlKey) {
			setOpenSearch(true)
		}
	})

	const openSearch = useMemoizedFn(() => {
		setOpenSearch(true)
		setOpenSidebar(false)
	})

	const closeSearch = useMemoizedFn(() => setOpenSearch(false))

	const props_search = {
		closeSearch
	}

	const Sidebar = (
		<nav
			className={$.cx(
				`
				fixed
				top-0
				left-0
				box-border
				z-[100]
				flex flex-col
				h-screen
				doc_sidebar
			`,
				styles.sidebar
			)}
		>
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
						<div
							className={$.cx(
								`
								flex
								items-center justify-center
								theme_item clickable
							`,
								theme === 'dark' && 'active'
							)}
							onClick={setDark}
						>
							<Moon weight='fill'></Moon>
						</div>
						<div
							className={$.cx(
								`
								flex
								items-center justify-center
								theme_item clickable
							`,
								theme === 'light' && 'active'
							)}
							onClick={setLight}
						>
							<SunDim weight='fill'></SunDim>
						</div>
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
					<MagnifyingGlass className='icon_search absolute' weight='bold'></MagnifyingGlass>
					<button className='btn_search box-border w-full cursor-pointer'>
						{t('header.btn_search')}
					</button>
					<div className='shortcuts absolute flex'>
						<kbd className='box-border flex items-center justify-center'>⌘</kbd>
						<kbd className='box-border flex items-center justify-center'>K</kbd>
					</div>
				</div>
			</div>
			<div className='menu_wrap box-border w-full'>
				<Menu
					mode='inline'
					ref={ref}
					items={menu}
					forceSubMenuRender
					openKeys={openkeys}
					selectedKeys={selectedkey ? [selectedkey] : []}
					onSelect={onSelect}
					onOpenChange={onOpenChange}
					onClick={onClick}
				></Menu>
				{openkeys.length < 2 && (
					<div className='shadow_tree flex items-center justify-center'>
						<Tree weight='thin'></Tree>
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
					<BoxArrowDown size={15} weight='fill'></BoxArrowDown>
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
					<ChatDots size={15} weight='fill'></ChatDots>
					<span className='ml-2'>{t('footer.contact')}</span>
				</Link>
			</div>
		</nav>
	)

	const show_btn_doc = useMemo(() => !['/docs', '/docs/gtd'].includes(pathname), [pathname])

	const onOpenSidebar = useMemoizedFn(() => setOpenSidebar(true))
	const onCloseSidebar = useMemoizedFn(() => setOpenSidebar(false))

	const onToc = useMemoizedFn(() => {
		toc_emitter.dispatchEvent(new CustomEvent('show_toc'))
	})

	useUpdateEffect(() => {
		onCloseSidebar()
	}, [pathname, hash])

	return (
		<div className={$.cx('w-screen', styles._local)}>
			<Modal
				bodyClassName={styles.search_modal}
				open={open_search}
				width={480}
				onCancel={closeSearch}
				maskClosable
			>
				<Search {...props_search}></Search>
			</Modal>
			<Drawer
				rootClassName={styles.sidebar_drawer}
				open={open_sidebar}
				placement='left'
				maskClosable
				width={300}
				closeIcon={null}
				onClose={onCloseSidebar}
				getContainer={() => document.body}
			>
				{Sidebar}
			</Drawer>
			<div
				className='
					fixed
					top-0
					left-0
					box-border
					z-[1000]
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
			{Sidebar}
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
