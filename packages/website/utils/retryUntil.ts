const Index = (retry_fn: Function, until_fn: () => boolean) => {
	if (!until_fn()) {
		window.requestAnimationFrame(() => Index(retry_fn, until_fn))
	} else {
		retry_fn()
	}
}

export default Index
