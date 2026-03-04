const Index = <T = any>() => {
	const mock_fn = () => Index<T>()

	return new Proxy(mock_fn, {
		get: () => Index<T>()
	}) as T
}

export default Index
