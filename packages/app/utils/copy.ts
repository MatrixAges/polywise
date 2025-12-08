export default async (v: string) => {
	await navigator.clipboard.writeText(v)
}
