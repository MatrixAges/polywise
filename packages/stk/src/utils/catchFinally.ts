type Any_fn = (...args: Array<any>) => any

type Ctx_of<T_fn extends Any_fn, T_ctx> = unknown extends ThisParameterType<T_fn> ? T_ctx : ThisParameterType<T_fn>

type Finally_callback<T_fn extends Any_fn, T_ctx> = (
	ctx: Ctx_of<T_fn, T_ctx>,
	...args: Parameters<T_fn>
) => void | Promise<void>

const catchFinally = <T_ctx, T_fn extends Any_fn = Any_fn>(callback: Finally_callback<T_fn, T_ctx>) => {
	return (target: T_ctx, key: string | symbol, descriptor: TypedPropertyDescriptor<T_fn>) => {
		const original_method = descriptor.value
		if (!original_method) return

		descriptor.value = async function (this: T_ctx, ...args: Parameters<T_fn>) {
			try {
				return await original_method.apply(this, args)
			} finally {
				await callback(this as Ctx_of<T_fn, T_ctx>, ...args)
			}
		} as T_fn
	}
}

export default catchFinally
