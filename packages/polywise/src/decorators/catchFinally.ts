export default (on_finally?: (...args: any[]) => void) =>
	(target: any, property: string, descriptor: PropertyDescriptor) => {
		const original_method = descriptor.value

		descriptor.value = async function (...args: any[]) {
			try {
				return await original_method.apply(this, args)
			} finally {
				if (on_finally) {
					on_finally.call(this, ...args)
				}
			}
		}

		return descriptor
	}
