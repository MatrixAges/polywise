export type EventName = PropertyKey

export type DatalessEventNames<EventData> = {
	[Key in keyof EventData]: EventData[Key] extends undefined ? Key : never
}[keyof EventData]

declare const listenerAdded: unique symbol
declare const listenerRemoved: unique symbol

export type OmnipresentEventData = {
	[listenerAdded]: ListenerChangedData
	[listenerRemoved]: ListenerChangedData
}

export type DebugLogger<EventData, Name extends keyof EventData> = (
	type: string,
	debugName: string,
	eventName?: Name | EventName,
	eventData?: EventData[Name] | string
) => void

export type DebugOptions<EventData> = {
	name?: string
	enabled?: boolean
	logger?: DebugLogger<EventData, keyof EventData>
}

export type Options<EventData> = {
	readonly debug?: DebugOptions<EventData>
}

export type EmitteryOncePromise<T> = {
	off(): void
} & Promise<T>

export type UnsubscribeFunction = () => void

export type ListenerChangedData = {
	listener: (eventData?: unknown) => any | Promise<any>

	eventName?: EventName
}
