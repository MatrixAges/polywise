export default (v: string) => {
	const word = v.trim()

	if (!word) return false
	if (/^[a-zA-Z]$/.test(word)) return false
	if (/^\d+$/.test(word)) return false

	return /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(word)
}
