import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { getId } from 'stk/utils'

export const auth_user = sqliteTable(
	'auth_user',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		name: text('name').notNull(),
		email: text('email').notNull(),
		emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
		image: text('image'),
		username: text('username').notNull(),
		displayUsername: text('display_username'),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	t => [uniqueIndex('auth_user_email_idx').on(t.email), uniqueIndex('auth_user_username_idx').on(t.username)]
)

export const auth_session = sqliteTable(
	'auth_session',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		token: text('token').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => auth_user.id, { onDelete: 'cascade' })
	},
	t => [
		uniqueIndex('auth_session_token_idx').on(t.token),
		index('auth_session_user_id_idx').on(t.userId),
		index('auth_session_expires_at_idx').on(t.expiresAt)
	]
)

export const auth_account = sqliteTable(
	'auth_account',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => auth_user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
		refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
		scope: text('scope'),
		password: text('password'),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	t => [
		index('auth_account_user_id_idx').on(t.userId),
		index('auth_account_provider_id_idx').on(t.providerId),
		uniqueIndex('auth_account_provider_account_idx').on(t.providerId, t.accountId)
	]
)

export const auth_verification = sqliteTable(
	'auth_verification',
	{
		id: text('id').primaryKey().$defaultFn(getId),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		createdAt: integer('created_at', { mode: 'timestamp' }),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
	},
	t => [index('auth_verification_identifier_idx').on(t.identifier)]
)
