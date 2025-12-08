export type Watch<Index> = {
	[key in keyof Index]: Index[key] extends (...args: any[]) => any
		? never
		: (new_value?: Index[key], old_value?: Index[key]) => any
}
