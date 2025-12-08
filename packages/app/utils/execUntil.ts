const Index = (until_fn: () => boolean | undefined | null | unknown, exec: Function) => {
	let framer

	if (!until_fn()) {
		framer = requestAnimationFrame(() => Index(until_fn, exec))
	} else {
		exec()

		if (framer) cancelAnimationFrame(framer)
	}
}

export default Index
