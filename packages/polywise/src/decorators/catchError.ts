export default (args?: { onError?: (error: any) => void; onFinally?: () => void }) =>
	(target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const original_method = descriptor.value

		descriptor.value = async function (...method_args: any[]) {
			try {
				return await original_method.apply(this, method_args)
			} catch (error) {
				if (args?.onError) {
					args.onError.call(this, error)
				} else {
					console.error(`Error in ${propertyKey}:`, error)
				}

				if (method_args[0]?.emitter?.isActiveStatus?.()) {
					method_args[0].emitter.finish()
				}

				throw error
			} finally {
				if (args?.onFinally) {
					args.onFinally.call(this)
				}

				if (this.brain?.setBusy) {
					this.brain.setBusy(false)
				}
			}
		}

		return descriptor
	}
