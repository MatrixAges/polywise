'use client'

import { useState } from 'react'
import { GithubLogoIcon } from '@phosphor-icons/react'
import {
	getReleaseLink,
	github_release_link,
	mac_arch_map,
	medias,
	os_map,
	version_file_link
} from '@website/appdata/app'
import Logo from '@website/components/Logo'
import { $ } from '@website/utils'
import { useAsyncEffect } from 'ahooks'
import { getGPUTier } from 'detect-gpu'
import { useTranslations } from 'next-intl'
import { ofetch } from 'ofetch'

import styles from './index.module.css'

import type { Arch, OS } from '@website/appdata/app'

const regex = /(?<=version:\s)(\S+)/
const default_platform = { os: 'darwin', arch: 'arm64' } satisfies { os: OS; arch: Arch }

const Index = () => {
	const t = useTranslations('download')
	const t_common = useTranslations('common')
	const t_global = useTranslations('global')
	const [version, setVersion] = useState('')
	const [loading_version, setLoadingVersion] = useState(true)
	const [loading_platform, setLoadingPlatform] = useState(true)
	const [platform, setPlatform] = useState<{ os: OS; arch: Arch }>(default_platform)

	useAsyncEffect(async () => {
		const user_agent = window.navigator.userAgent.toLowerCase()

		try {
			const version_file = await ofetch(version_file_link, {
				headers: { 'Cache-Control': 'no-cache' },
				parseResponse: txt => txt
			})

			const match = version_file.match(regex)
			const next_version = match?.at(0) ?? ''

			setVersion(next_version)
		} finally {
			setLoadingVersion(false)
		}

		if (user_agent.includes('windows')) setPlatform({ os: 'win32', arch: 'x64' })

		if (user_agent.includes('mac os x')) {
			const { gpu } = await getGPUTier()
			const gpu_name = gpu?.toLowerCase() ?? ''

			if (gpu_name.includes('intel') || gpu_name.includes('amd') || gpu_name.includes('radeon')) {
				setPlatform({ os: 'darwin', arch: 'x64' })
			}
		}

		setLoadingPlatform(false)
	}, [])

	const button_platform = `${os_map[platform.os]} (${mac_arch_map[platform.arch]})`
	const button_link = version ? getReleaseLink(platform.os, platform.arch, version) : github_release_link
	const loading_button = loading_version || loading_platform
	const macos_arm_link = version ? getReleaseLink('darwin', 'arm64', version) : github_release_link
	const macos_x64_link = version ? getReleaseLink('darwin', 'x64', version) : github_release_link
	const windows_x64_link = version ? getReleaseLink('win32', 'x64', version) : github_release_link

	return (
		<div className={$.cx('small_content_wrap', styles._local)}>
			<div className='header_wrap flex flex-col items-center'>
				<div
					className='
						relative
						flex
						items-center justify-center
						logo_wrap
					'
				>
					<Logo className='logo' size={72} color='var(--color_text)' />
				</div>
				<h1 className='title'>{t('title')}</h1>
				<span className='desc'>{t('desc')}</span>
				<a href={button_link} target='_blank'>
					<button
						className='
							flex
							items-center justify-center
							btn_download btn_light
						'
					>
						{loading_button
							? t_global('download')
							: version
								? t('btn_download', { platform: button_platform })
								: t_global('download')}
					</button>
				</a>
				{version && (
					<span className='version'>
						{t('latest')}: v{version}
					</span>
				)}
			</div>
			<div className='download_items flex flex-col'>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<img src='/images/svg/macos.svg' alt='macos' />
						<span className='name'>{t_common('download.desktop.macos.arm64.title')}</span>
					</div>
					<a href={macos_arm_link} target='_blank'>
						<button className='btn_download btn_light'>{t_global('download')}</button>
					</a>
				</div>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<img src='/images/svg/macos.svg' alt='macos' />
						<span className='name'>{t_common('download.desktop.macos.x64.title')}</span>
					</div>
					<a href={macos_x64_link} target='_blank'>
						<button className='btn_download btn_light'>{t_global('download')}</button>
					</a>
				</div>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<img src='/images/svg/windows.svg' alt='windows' />
						<span className='name'>{t_common('download.desktop.windows.x64.title')}</span>
					</div>
					<a href={windows_x64_link} target='_blank'>
						<button className='btn_download btn_light'>{t_global('download')}</button>
					</a>
				</div>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<GithubLogoIcon weight='fill' size={16} />
						<span className='name'>{t('github_release')}</span>
					</div>
					<a href={github_release_link} target='_blank'>
						<button className='btn_download btn_light'>{t_global('visit')}</button>
					</a>
				</div>
				<div className='download_item flex items-center justify-between'>
					<div className='flex items-center'>
						<GithubLogoIcon weight='fill' size={16} />
						<span className='name'>{t('source_repository')}</span>
					</div>
					<a href={medias.github} target='_blank'>
						<button className='btn_download btn_light'>{t_global('visit')}</button>
					</a>
				</div>
			</div>
		</div>
	)
}

export default Index
