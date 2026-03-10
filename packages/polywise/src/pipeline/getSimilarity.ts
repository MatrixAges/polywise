export default (vec_a: Array<number>, vec_b: Array<number>) => {
	const dot_product = vec_a.reduce((acc, val, index) => acc + val * vec_b[index], 0)
	const norm_a = Math.sqrt(vec_a.reduce((acc, val) => acc + val * val, 0))
	const norm_b = Math.sqrt(vec_b.reduce((acc, val) => acc + val * val, 0))

	if (!norm_a || !norm_b) return 0

	return dot_product / (norm_a * norm_b)
}
