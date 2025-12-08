export type ViodFn = () => void

export type NestedObject = {
	[key: string]: NestedObject | string | number | boolean | null | undefined
}

export type FlatObject<T extends NestedObject> = {
	[K in FlattenKeys<T>]: string
}

export type FlattenKeys<T> = T extends object
	? {
			[K in keyof T & (string | number)]: T[K] extends NestedObject
				? `${K}.${FlattenKeys<T[K]> & string}`
				: K
		}[keyof T & (string | number)]
	: never
