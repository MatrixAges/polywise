import type { ImAdapter, ImAdapterCapabilities, ImPlatform } from '../types'

export abstract class BaseImAdapter implements ImAdapter {
	abstract platform: ImPlatform
	abstract capabilities: ImAdapterCapabilities
	readonly account_id: string

	constructor(account_id: string) {
		this.account_id = account_id
	}

	abstract connect(): Promise<void>
	abstract disconnect(): Promise<void>
	abstract sendTyping(route: Parameters<ImAdapter['sendTyping']>[0]): ReturnType<ImAdapter['sendTyping']>
	abstract sendMessage(args: Parameters<ImAdapter['sendMessage']>[0]): ReturnType<ImAdapter['sendMessage']>
	editMessage?(
		args: Parameters<NonNullable<ImAdapter['editMessage']>>[0]
	): ReturnType<NonNullable<ImAdapter['editMessage']>>
	handleBridgeEvent?(payload: unknown): Promise<Awaited<ReturnType<NonNullable<ImAdapter['handleBridgeEvent']>>>>
	handleBridgeStatus?(payload: unknown): Promise<void>
	verifyBridgePayload?(raw_body: string, signature: string | undefined): Promise<boolean>
}
