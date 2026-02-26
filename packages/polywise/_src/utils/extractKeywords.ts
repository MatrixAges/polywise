export default (query: string) =>
	query
		.toLowerCase()
		.split(/\s+/)
		.filter(w => w.length > 2)
