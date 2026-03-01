export default (onFinally?: (...args: Array<any>) => void) =>
	(target: any, property: string, descriptor: PropertyDescriptor) => {
		void target
		void property

		const original_method = descriptor.value

		descriptor.value = async function (...args: Array<any>) {
			try {
				return await original_method.apply(this, args)
			} finally {
				if (onFinally) {
					onFinally.call(this, ...args)
				}
			}
		}

		return descriptor
	}
