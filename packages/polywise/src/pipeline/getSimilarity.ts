import simsimd from 'simsimd'

export default (
	vec_a: Array<number> | Float32Array | Float64Array,
	vec_b: Array<number> | Float32Array | Float64Array
) => {
	const a = vec_a instanceof Float64Array ? vec_a : new Float64Array(vec_a)
	const b = vec_b instanceof Float64Array ? vec_b : new Float64Array(vec_b)

	return 1 - simsimd.cosine(a, b)
}
