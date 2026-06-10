export interface CodexAuthFile {
	auth_mode?: string
	last_refresh?: string
	tokens?: {
		access_token?: string
		refresh_token?: string
		id_token?: string
		account_id?: string
	}
}

export interface CodexAuthState {
	auth_mode: string
	last_refresh: string | null
	access_token: string
	refresh_token: string
	id_token: string
	account_id: string
}
