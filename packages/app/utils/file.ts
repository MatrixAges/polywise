export const downloadFile = (filename: string, text: string, ext: string, mime_type?: string) => {
	const blob = new Blob([text], { type: mime_type ?? 'text/plain;charset=utf-8' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')

	link.style.display = 'none'
	link.href = url
	link.download = `${filename}.${ext}`

	document.body.appendChild(link)

	link.click()

	document.body.removeChild(link)

	URL.revokeObjectURL(url)
}

export const uploadFile = (args?: { max_count?: number; accept?: string }) => {
	const { max_count = 1, accept } = args || {}
	const input = document.createElement('input') as HTMLInputElement

	input.style.display = 'none'
	input.type = 'file'
	input.multiple = max_count! > 1

	if (accept) input.accept = accept

	const { promise, resolve } = Promise.withResolvers<Array<File> | File | false>()

	const onChange = (e: Event) => {
		let files = Array.from((e.target as HTMLInputElement).files!)

		if (max_count && files.length > max_count) {
			files = files.slice(0, max_count)
		}

		input.removeEventListener('change', onChange)
		input.remove()

		resolve(max_count === 1 ? files[0] : files)
	}

	input.addEventListener('change', onChange)

	input.addEventListener('cancel', () => {
		input.removeEventListener('change', onChange)
		input.remove()

		resolve(false)
	})

	document.body.appendChild(input)

	input.click()

	return promise
}
