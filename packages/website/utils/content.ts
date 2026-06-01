import { default_locale } from '@website/app.config'
import { headers } from 'next/headers'

import type { Locales } from '@website/app.config'

interface ResponseStatusError extends Error {
	response: {
		status: number
	}
}

let assets_binding_promise: Promise<Env['ASSETS'] | null> | null = null

const resolveContentPath = (section: string, slug: string, locale: string) => {
	return `/content/${section}/${slug}/${locale}.mdx`
}

const isLocalHost = (host: string) => {
	return (
		host.includes('localhost') ||
		host.includes('127.0.0.1') ||
		host.includes('0.0.0.0') ||
		host.includes('[::1]')
	)
}

const resolveOrigin = async () => {
	const requestHeaders = await headers()
	const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')

	if (host) {
		const protocol = requestHeaders.get('x-forwarded-proto') ?? (isLocalHost(host) ? 'http' : 'https')

		return `${protocol}://${host}`
	}

	return `http://localhost:${process.env.PORT ?? '3000'}`
}

const createResponseStatusError = (response: Response) => {
	const error = new Error(`Failed to load content: ${response.status}`) as ResponseStatusError

	error.response = {
		status: response.status
	}

	return error
}

const resolveAssetUrl = (contentPath: string) => {
	return new URL(contentPath, 'https://assets.local')
}

const getAssetsBinding = async () => {
	if (!assets_binding_promise) {
		assets_binding_promise = import('cloudflare:workers')
			.then(module => module.env.ASSETS ?? null)
			.catch(() => null)
	}

	return await assets_binding_promise
}

const requestContentFromAssets = async (contentPath: string) => {
	const assets_binding = await getAssetsBinding()

	if (!assets_binding) {
		return null
	}

	const response = await assets_binding.fetch(new Request(resolveAssetUrl(contentPath)))

	if (response.status === 404) {
		return null
	}

	if (!response.ok) {
		throw createResponseStatusError(response)
	}

	return await response.text()
}

const requestContent = async (contentPath: string) => {
	const asset_content = await requestContentFromAssets(contentPath)

	if (asset_content !== null) {
		return asset_content
	}

	const origin = await resolveOrigin()
	const response = await fetch(new URL(contentPath, origin), {
		cache: 'no-store'
	})

	if (response.status === 404) {
		throw createResponseStatusError(response)
	}

	if (!response.ok) {
		throw createResponseStatusError(response)
	}

	return await response.text()
}

const is404 = (error: unknown) => {
	return (
		typeof error === 'object' &&
		error !== null &&
		'response' in error &&
		typeof error.response === 'object' &&
		error.response !== null &&
		'status' in error.response &&
		error.response.status === 404
	)
}

export const getContent = async (section: string, slug: string, locale: Locales) => {
	try {
		return await requestContent(resolveContentPath(section, slug, locale))
	} catch (error) {
		if (!is404(error) || locale === default_locale) {
			if (is404(error)) {
				return null
			}

			throw error
		}
	}

	try {
		return await requestContent(resolveContentPath(section, slug, default_locale))
	} catch (error) {
		if (is404(error)) {
			return null
		}

		throw error
	}
}

export const getContentList = async (section: string, slugs: Array<string>, locale: Locales) => {
	const list = await Promise.all(slugs.map(slug => getContent(section, slug, locale)))

	return list.filter(Boolean) as Array<string>
}
