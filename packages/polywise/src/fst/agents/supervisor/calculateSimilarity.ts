export default (str1: string, str2: string) => {
	if (!str1 || !str2) return 0

	const set1 = new Set(str1.split(' '))
	const set2 = new Set(str2.split(' '))

	const intersection = new Set([...set1].filter(x => set2.has(x)))
	const union = new Set([...set1, ...set2])

	return intersection.size / union.size
}
