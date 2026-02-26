export default (vectors: Array<Array<number>>) => {
	if (vectors.length === 0) return []

	const vector_length = vectors[0].length
	const summed_vector = new Array<number>(vector_length).fill(0)

	for (const vec of vectors) {
		for (let index = 0; index < vector_length; index++) {
			summed_vector[index] += vec[index]
		}
	}

	return summed_vector.map(value => value / vectors.length)
}
