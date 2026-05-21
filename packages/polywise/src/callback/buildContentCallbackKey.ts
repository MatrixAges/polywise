export default (trace_id: string, hit_items: Array<string>, miss_items: Array<string>) => {
	const hits = [...hit_items].sort().join(',')
	const misses = [...miss_items].sort().join(',')

	return `${trace_id}::${hits}::${misses}`
}
