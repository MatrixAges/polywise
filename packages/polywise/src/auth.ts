import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { hashPassword } from 'better-auth/crypto'
import { betterAuth } from 'better-auth/minimal'
import { username } from 'better-auth/plugins'
import { and, eq } from 'drizzle-orm'
import { getId } from 'stk/utils'

import { config } from './config'
import { auth_account, auth_session, auth_user, auth_verification } from './db/schema'
import { env } from './env'

import type { Auth, BetterAuthOptions } from 'better-auth'

const auth_username = 'polywiser'
const auth_email = 'polywiser@localhost'
const auth_provider_id = 'credential'
const default_auth_base_url = 'http://localhost:3072'
const auth_trusted_origins = [
	'http://localhost:3071',
	'http://127.0.0.1:3071',
	...(process.env.POLYWISE_AUTH_TRUSTED_ORIGINS || '')
		.split(',')
		.map(item => item.trim())
		.filter(Boolean)
]

const resolveAuthBaseUrl = () => {
	for (const candidate of [
		process.env.BETTER_AUTH_URL,
		process.env.POLYWISE_AUTH_URL,
		process.env.POLYWISE_SERVER_URL,
		default_auth_base_url
	]) {
		const value = candidate?.trim()

		if (!value) {
			continue
		}

		try {
			return new URL(value).toString().replace(/\/$/, '')
		} catch {}
	}

	return default_auth_base_url
}

const auth_schema = {
	user: auth_user,
	session: auth_session,
	account: auth_account,
	verification: auth_verification
}

const auth_enabled = () => config.auth?.enabled === true
const auth_platform_bypassed = () => env.platform === 'electron'

const getAuthOptions = () =>
	({
		database: drizzleAdapter(env.db, {
			provider: 'sqlite',
			schema: auth_schema
		}),
		emailAndPassword: {
			enabled: true
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24
		},
		baseURL: resolveAuthBaseUrl(),
		trustedOrigins: auth_trusted_origins,
		plugins: [username()]
	}) satisfies BetterAuthOptions

const createAuth = () => betterAuth(getAuthOptions())

type AuthInstance = Auth<ReturnType<typeof getAuthOptions>>

let auth_instance: AuthInstance | null = null

const appendHeaders = (target: Headers, source: Headers) => {
	source.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') {
			target.append(key, value)
			return
		}

		target.set(key, value)
	})
}

export const getAuth = (): AuthInstance => {
	if (auth_instance) {
		return auth_instance
	}

	if (!env.db) {
		throw new Error('Auth database is not initialized.')
	}

	auth_instance = createAuth()

	return auth_instance
}

export const getAuthTrustedOrigins = () => [...auth_trusted_origins]

export const getConfiguredAuthUser = async () => {
	return (await env.db.select().from(auth_user).where(eq(auth_user.username, auth_username)).limit(1))[0] || null
}

const getAnyAuthUser = async () => {
	return (await env.db.select({ id: auth_user.id }).from(auth_user).limit(1))[0] || null
}

const getConfiguredCredentialAccount = async () => {
	const user = await getConfiguredAuthUser()

	if (!user) {
		return null
	}

	return (
		(
			await env.db
				.select()
				.from(auth_account)
				.where(and(eq(auth_account.userId, user.id), eq(auth_account.providerId, auth_provider_id)))
				.limit(1)
		)[0] || null
	)
}

export const hasConfiguredAccount = async () => Boolean(await getAnyAuthUser())

export const isAuthRequired = async () => {
	if (!auth_enabled() || auth_platform_bypassed()) {
		return false
	}

	return await hasConfiguredAccount()
}

export const readRequestSession = async (headers: Headers, resHeaders = new Headers()) => {
	const result = await getAuth()
		.api.getSession({
			headers,
			asResponse: false,
			returnHeaders: true
		})
		.catch(() => null)

	if (result?.headers) {
		appendHeaders(resHeaders, result.headers)
	}

	return result?.response ?? null
}

export const bootstrapAuthPassword = async (password: string) => {
	const existing_user = await getAnyAuthUser()

	if (existing_user) {
		throw new Error('Auth account is already configured.')
	}

	const now = new Date()
	const user_id = getId()
	const password_hash = await hashPassword(password)

	env.sqlite.transaction(() => {
		env.db
			.insert(auth_user)
			.values({
				id: user_id,
				name: auth_username,
				email: auth_email,
				emailVerified: true,
				image: null,
				username: auth_username,
				displayUsername: auth_username,
				createdAt: now,
				updatedAt: now
			})
			.run()

		env.db
			.insert(auth_account)
			.values({
				id: getId(),
				accountId: user_id,
				providerId: auth_provider_id,
				userId: user_id,
				password: password_hash,
				createdAt: now,
				updatedAt: now
			})
			.run()
	})()
}

export const changeConfiguredPassword = async (next_password: string) => {
	const account = await getConfiguredCredentialAccount()

	if (!account?.password) {
		throw new Error('Auth account is not configured.')
	}

	await env.db
		.update(auth_account)
		.set({
			password: await hashPassword(next_password),
			updatedAt: new Date()
		})
		.where(eq(auth_account.id, account.id))
}

export const getAuthStatus = async (headers: Headers, resHeaders = new Headers()) => {
	const has_account = await hasConfiguredAccount()
	const session = await readRequestSession(headers, resHeaders)
	const authenticated = Boolean(session?.user && session?.session)
	const requires_auth = auth_enabled() && !auth_platform_bypassed() && has_account
	const bootstrap_required = auth_enabled() && !has_account
	const can_change_password = env.platform === 'electron' || authenticated

	return {
		enabled: auth_enabled(),
		platform: env.platform,
		requires_auth,
		has_account,
		bootstrap_required,
		authenticated,
		can_change_password,
		username: auth_username,
		user: session?.user ?? null
	}
}

export const requireRequestSession = async (headers: Headers, resHeaders = new Headers()) => {
	if (!(await isAuthRequired())) {
		return {
			user: null,
			session: null
		}
	}

	return await readRequestSession(headers, resHeaders)
}

export const applyResponseHeaders = appendHeaders
export { isLocalCliRequest, polywise_cli_header } from './utils/localCliAuth'

export default getAuth
