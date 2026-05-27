import { makeAutoObservable } from 'mobx'
import { injectable } from 'tsyringe'

import { server_base_url } from '@/appdata'
import { rpc } from '@/utils'

export interface AuthStatus {
	enabled: boolean
	platform: 'standalone' | 'electron'
	requires_auth: boolean
	has_account: boolean
	bootstrap_required: boolean
	authenticated: boolean
	can_change_password: boolean
	username: string
	user: Record<string, unknown> | null
}

@injectable()
export default class AuthModel {
	status = null as AuthStatus | null
	loading = false

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	get enabled() {
		return Boolean(this.status?.enabled)
	}

	get requiresAuth() {
		return Boolean(this.status?.requires_auth)
	}

	get authenticated() {
		return Boolean(this.status?.authenticated)
	}

	get bootstrapRequired() {
		return Boolean(this.status?.bootstrap_required)
	}

	get canChangePassword() {
		return Boolean(this.status?.can_change_password)
	}

	async init() {
		await this.refreshStatus()
	}

	async refreshStatus() {
		this.loading = true

		try {
			this.status = await rpc.auth.status.query()
			return this.status
		} finally {
			this.loading = false
		}
	}

	async login(password: string) {
		const response = await fetch(`${server_base_url}/api/auth/sign-in/username`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			credentials: 'include',
			body: JSON.stringify({
				username: this.status?.username || 'polywiser',
				password
			})
		})

		const data = await response.json().catch(() => ({}))

		if (!response.ok) {
			throw new Error(
				typeof data?.message === 'string' ? data.message : `Login failed (${response.status})`
			)
		}

		await this.refreshStatus()

		return data
	}

	async bootstrapPassword(password: string) {
		await rpc.auth.bootstrap.mutate({ password })
		await this.refreshStatus()
	}

	async changePassword(current_password: string, new_password: string) {
		await rpc.auth.changePassword.mutate({ current_password, new_password })
		await this.refreshStatus()
	}

	deinit() {}
}
