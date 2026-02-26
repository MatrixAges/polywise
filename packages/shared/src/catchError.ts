type Any_fn = (...args: Array<any>) => any

type Ctx_of<T_fn extends Any_fn, T_ctx> = unknown extends ThisParameterType<T_fn> ? T_ctx : ThisParameterType<T_fn>

type Error_callback<T_fn extends Any_fn, T_ctx> = (
	error: unknown,
	ctx: Ctx_of<T_fn, T_ctx>,
	...args: Parameters<T_fn>
) => void | Promise<void>

const catchError = <T_ctx, T_fn extends Any_fn = Any_fn>(callback: Error_callback<T_fn, T_ctx>) => {
	return (target: T_ctx, key: string | symbol, descriptor: TypedPropertyDescriptor<T_fn>) => {
		const original_method = descriptor.value
		if (!original_method) return

		descriptor.value = async function (this: T_ctx, ...args: Parameters<T_fn>) {
			try {
				return await original_method.apply(this, args)
			} catch (error) {
				await callback(error, this as Ctx_of<T_fn, T_ctx>, ...args)
				throw error
			}
		} as T_fn
	}
}

export default catchError
