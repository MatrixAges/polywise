export default (onError?: (error: any, ...args: any[]) => void | boolean) =>
	(target: any, property?: string, descriptor?: PropertyDescriptor): any => {
		if (property && descriptor) {
			const original_method = descriptor.value

			descriptor.value = async function (...args: any[]) {
				try {
					return await original_method.apply(this, args)
				} catch (error) {
					if (onError) {
						const handled = onError.call(this, error, ...args)

						if (handled === true) return
					}

					throw error
				}
			}

			return descriptor
		}

		return class extends target {
			constructor(...args: any[]) {
				super(...args)

				const proto = target.prototype

				for (const key of Object.getOwnPropertyNames(proto)) {
					const descriptor = Object.getOwnPropertyDescriptor(proto, key)

					if (descriptor && typeof descriptor.value === 'function' && key !== 'constructor') {
						const original_method = descriptor.value

						this[key] = async (...method_args: any[]) => {
							try {
								const result = original_method.apply(this, method_args)

								if (result instanceof Promise) {
									return await result
								}

								return result
							} catch (error) {
								if (onError) {
									const handled = onError.call(this, error, ...method_args)

									if (handled === true) return
								}

								throw error
							}
						}
					}
				}
			}
		}
	}
