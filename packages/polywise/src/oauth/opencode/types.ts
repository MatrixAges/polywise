export type OpenCodeCredential = {
	name: string
	method: string
}

export type OpenCodeAuthFile = Record<
	string,
	{
		key?: string
		type?: string
	}
>

export interface OpenCodeConnectionState {
	installed: boolean
	credentials: Array<OpenCodeCredential>
}
